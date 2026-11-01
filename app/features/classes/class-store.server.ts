import { and, asc, count, eq } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { findPeople } from "~/features/accounts/account-store.server";
import type { Person } from "~/features/accounts/account-store.server";
import { randomReadableText } from "~/random-text.server";
import type { Rupiah } from "~/units/rupiah";
import { classes, memberships } from "./classes.schema";
import type { ClassId, MembershipId } from "./classes.schema";
import { joinCodeLength } from "./join-code";
import type { JoinCode } from "./join-code";

/** A class as its lecturer sees it in the list of classes. */
export interface TaughtClass {
  id: ClassId;
  name: string;
  startingCash: Rupiah;
  joinCode: JoinCode;
  studentCount: number;
}

/** A class as a student sees it, or as a visitor with its code sees it before joining. */
export interface ClassForStudents {
  id: ClassId;
  name: string;
  lecturerName: string;
  startingCash: Rupiah;
}

/** A class that a student joined, with the membership that the portfolio of the student in it belongs to. */
export interface JoinedClass extends ClassForStudents {
  membershipId: MembershipId;
  joinedAt: Date;
}

/** A student in a class, as the lecturer of the class sees them. */
export interface ClassStudent extends Person {
  joinedAt: Date;
}

/** What a lecturer gives to create a class. */
export interface NewClass {
  lecturerId: UserId;
  name: string;
  startingCash: Rupiah;
}

// The name of the lecturer comes from the accounts feature, which owns the table of people, so a query of classes selects the id of the lecturer and withLecturerNames adds the name.
const classForStudentsColumns = {
  id: classes.id,
  name: classes.name,
  lecturerId: classes.lecturerId,
  startingCash: classes.startingCash,
};

const membershipColumns = {
  studentId: memberships.studentId,
  joinedAt: memberships.joinedAt,
};

/** Creates a class with a new code and returns its id. */
export function createClass(
  database: Database,
  newClass: NewClass,
  now: Date,
): ClassId {
  // The characters of a code are those that randomReadableText writes. Two classes draw the same code once in about a trillion pairs, so the unique index refuses that case as the failure that it is.
  const joinCode = randomReadableText(joinCodeLength) as JoinCode;
  const [created] = database
    .insert(classes)
    .values({ ...newClass, joinCode, createdAt: now })
    .returning({ id: classes.id })
    .all();
  if (created === undefined) {
    throw new Error("SQLite created no class and reported no error.");
  }
  return created.id;
}

/** Lists the classes that a lecturer teaches, in the order in which the lecturer created them, with the number of students in each. */
export function listTaughtClasses(
  database: Database,
  lecturerId: UserId,
): TaughtClass[] {
  return database
    .select({
      id: classes.id,
      name: classes.name,
      startingCash: classes.startingCash,
      joinCode: classes.joinCode,
      studentCount: count(memberships.id),
    })
    .from(classes)
    .leftJoin(memberships, eq(memberships.classId, classes.id))
    .where(eq(classes.lecturerId, lecturerId))
    .groupBy(classes.id)
    .orderBy(asc(classes.createdAt), asc(classes.id))
    .all();
}

/** Finds a class that a lecturer teaches, or undefined when the class does not exist or another lecturer teaches it. */
export function findTaughtClass(
  database: Database,
  classId: ClassId,
  lecturerId: UserId,
): Omit<TaughtClass, "studentCount"> | undefined {
  return database
    .select({
      id: classes.id,
      name: classes.name,
      startingCash: classes.startingCash,
      joinCode: classes.joinCode,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.lecturerId, lecturerId)))
    .get();
}

/** Lists the students of a class, in the order in which they joined. */
export function listStudents(
  database: Database,
  classId: ClassId,
): ClassStudent[] {
  const rows = database
    .select(membershipColumns)
    .from(memberships)
    .where(eq(memberships.classId, classId))
    .orderBy(asc(memberships.joinedAt), asc(memberships.id))
    .all();
  return withStudents(database, rows);
}

/** Lists the classes that a student joined, in the order in which the student joined them. */
export function listJoinedClasses(
  database: Database,
  studentId: UserId,
): JoinedClass[] {
  const rows = selectJoinedClasses(database)
    .where(eq(memberships.studentId, studentId))
    .orderBy(asc(memberships.joinedAt), asc(memberships.id))
    .all();
  return withLecturerNames(database, rows);
}

/** Finds a class that a student joined, or undefined when the class does not exist or the student is not in it. */
export function findJoinedClass(
  database: Database,
  classId: ClassId,
  studentId: UserId,
): JoinedClass | undefined {
  const row = selectJoinedClasses(database)
    .where(
      and(
        eq(memberships.classId, classId),
        eq(memberships.studentId, studentId),
      ),
    )
    .get();
  return row === undefined ? undefined : withLecturerNames(database, [row])[0];
}

/** Finds the class that a code opens, or undefined when no class has the code. */
export function findClassByJoinCode(
  database: Database,
  joinCode: JoinCode,
): ClassForStudents | undefined {
  const row = database
    .select(classForStudentsColumns)
    .from(classes)
    .where(eq(classes.joinCode, joinCode))
    .get();
  return row === undefined ? undefined : withLecturerNames(database, [row])[0];
}

/** Adds a student to a class, and does nothing when the student is in it already. */
export function joinClass(
  database: Database,
  { classId, studentId }: { classId: ClassId; studentId: UserId },
  now: Date,
): void {
  database
    .insert(memberships)
    .values({ classId, studentId, joinedAt: now })
    .onConflictDoNothing({
      target: [memberships.classId, memberships.studentId],
    })
    .run();
}

/** Finds a student of a class, or undefined when the person is not a student of the class. */
export function findClassStudent(
  database: Database,
  classId: ClassId,
  studentId: UserId,
): ClassStudent | undefined {
  const row = database
    .select(membershipColumns)
    .from(memberships)
    .where(
      and(
        eq(memberships.classId, classId),
        eq(memberships.studentId, studentId),
      ),
    )
    .get();
  return row === undefined ? undefined : withStudents(database, [row])[0];
}

function selectJoinedClasses(database: Database) {
  return database
    .select({
      ...classForStudentsColumns,
      membershipId: memberships.id,
      joinedAt: memberships.joinedAt,
    })
    .from(memberships)
    .innerJoin(classes, eq(classes.id, memberships.classId))
    .$dynamic();
}

/** Replaces the id of the lecturer of each class with the name of the lecturer. */
function withLecturerNames<Row extends { lecturerId: UserId }>(
  database: Database,
  rows: readonly Row[],
): (Omit<Row, "lecturerId"> & { lecturerName: string })[] {
  const lecturers = findPeople(
    database,
    rows.map((row) => row.lecturerId),
  );
  return rows.map(({ lecturerId, ...row }) => ({
    ...row,
    lecturerName: personWithId(lecturers, lecturerId).name,
  }));
}

/** Turns each membership into the student with the time when the student joined. */
function withStudents(
  database: Database,
  rows: readonly { studentId: UserId; joinedAt: Date }[],
): ClassStudent[] {
  const students = findPeople(
    database,
    rows.map((row) => row.studentId),
  );
  return rows.map((row) => ({
    ...personWithId(students, row.studentId),
    joinedAt: row.joinedAt,
  }));
}

// A class and a membership refer to their people through foreign keys, so a person that findPeople misses is a broken database.
function personWithId(people: Map<UserId, Person>, id: UserId): Person {
  const person = people.get(id);
  if (person === undefined) {
    throw new Error(`The account ${String(id)} of a class does not exist.`);
  }
  return person;
}
