import { and, asc, count, eq } from "drizzle-orm";
import type { Database } from "../../database/database.server.ts";
import type { Role, UserId } from "../accounts/accounts.schema.ts";
import { findPeople } from "../accounts/account-store.server.ts";
import type { Person } from "../accounts/account-store.server.ts";
import { randomReadableText } from "../../random-text.server.ts";
import type { Rupiah } from "../../units/rupiah.ts";
import { classes, memberships } from "./classes.schema.ts";
import type { ClassId, MembershipId } from "./classes.schema.ts";
import { joinCodeLength } from "./join-code.ts";
import type { JoinCode } from "./join-code.ts";

/** A class as its lecturer sees it in the list of classes, with the calendar date when its first session meets, such as 2026-09-07. A class that Portolab created before it stored that date has none until its lecturer sets it. */
interface TaughtClass {
  id: ClassId;
  name: string;
  startingCash: Rupiah;
  joinCode: JoinCode;
  firstSessionDate: string | null;
  studentCount: number;
}

/** A class that a lecturer teaches, as its own pages read it. */
export type TaughtClassRecord = Omit<TaughtClass, "studentCount">;

/** A class as a student sees it, or as a visitor with its code sees it before joining. */
export interface ClassForStudents {
  id: ClassId;
  name: string;
  lecturerName: string;
  startingCash: Rupiah;
}

/** A class that a student joined, with the place of the student in it, to which the portfolio of the student in the class belongs, the time when the student joined it, and the calendar date when its first session meets, which a class that Portolab created before it stored that date lacks until its lecturer sets it. */
export interface JoinedClass extends ClassForStudents {
  membershipId: MembershipId;
  joinedAt: Date;
  firstSessionDate: string | null;
}

/** A student in a class, as the lecturer of the class sees them, with the place of the student in the class, to which the portfolio of the student in the class belongs. */
export interface ClassStudent extends Person {
  membershipId: MembershipId;
  joinedAt: Date;
}

/** What a lecturer gives to create a class, with the calendar date when its first session meets. */
export interface NewClass {
  lecturerId: UserId;
  name: string;
  startingCash: Rupiah;
  firstSessionDate: string;
}

// The name of the lecturer comes from the accounts feature, which owns the table of people, so a query of classes selects the id of the lecturer and withLecturerNames adds the name.
const classForStudentsColumns = {
  id: classes.id,
  name: classes.name,
  lecturerId: classes.lecturerId,
  startingCash: classes.startingCash,
};

const membershipColumns = {
  membershipId: memberships.id,
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
function listTaughtClasses(
  database: Database,
  lecturerId: UserId,
): TaughtClass[] {
  return database
    .select({
      id: classes.id,
      name: classes.name,
      startingCash: classes.startingCash,
      joinCode: classes.joinCode,
      firstSessionDate: classes.firstSessionDate,
      studentCount: count(memberships.id),
    })
    .from(classes)
    .leftJoin(memberships, eq(memberships.classId, classes.id))
    .where(eq(classes.lecturerId, lecturerId))
    .groupBy(classes.id)
    .orderBy(asc(classes.createdAt), asc(classes.id))
    .all();
}

/** The classes of a person who is signed in: those that a lecturer teaches, in the order in which the lecturer created them, or those that a student joined, in the order in which the student joined them. */
export type ReaderClasses =
  | { role: "lecturer"; classes: TaughtClass[] }
  | { role: "student"; classes: JoinedClass[] };

/** Lists the classes that a person teaches or joined, by the role of the person. */
export function listReaderClasses(
  database: Database,
  reader: { id: UserId; role: Role },
): ReaderClasses {
  switch (reader.role) {
    case "lecturer":
      return {
        role: reader.role,
        classes: listTaughtClasses(database, reader.id),
      };
    case "student":
      return {
        role: reader.role,
        classes: listJoinedClasses(database, reader.id),
      };
  }
}

/** Finds a class that a lecturer teaches, or undefined when the class does not exist or another lecturer teaches it. */
export function findTaughtClass(
  database: Database,
  classId: ClassId,
  lecturerId: UserId,
): TaughtClassRecord | undefined {
  return database
    .select({
      id: classes.id,
      name: classes.name,
      startingCash: classes.startingCash,
      joinCode: classes.joinCode,
      firstSessionDate: classes.firstSessionDate,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.lecturerId, lecturerId)))
    .get();
}

/** Sets the calendar date when the first session of a class meets, from which its later sessions follow one a week. */
export function setFirstSessionDate(
  database: Database,
  classId: ClassId,
  firstSessionDate: string,
): void {
  database
    .update(classes)
    .set({ firstSessionDate })
    .where(eq(classes.id, classId))
    .run();
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
function listJoinedClasses(
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

/** Whether a person teaches or joined a class, by the role of the person. A class that does not exist belongs to no one. */
export function isReaderClass(
  database: Database,
  reader: { id: UserId; role: Role },
  classId: ClassId,
): boolean {
  switch (reader.role) {
    case "lecturer":
      return findTaughtClass(database, classId, reader.id) !== undefined;
    case "student":
      return findJoinedClass(database, classId, reader.id) !== undefined;
  }
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
      firstSessionDate: classes.firstSessionDate,
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

/** Turns each membership into the student with the place of the student in the class and the time when the student joined. */
function withStudents(
  database: Database,
  rows: readonly {
    membershipId: MembershipId;
    studentId: UserId;
    joinedAt: Date;
  }[],
): ClassStudent[] {
  const students = findPeople(
    database,
    rows.map((row) => row.studentId),
  );
  return rows.map((row) => ({
    ...personWithId(students, row.studentId),
    membershipId: row.membershipId,
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
