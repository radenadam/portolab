import { and, asc, count, eq } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { users } from "~/features/accounts/accounts.schema";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { Username } from "~/features/accounts/username";
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
export interface ClassStudent {
  id: UserId;
  name: string;
  username: Username;
  joinedAt: Date;
}

/** What a lecturer gives to create a class. */
export interface NewClass {
  lecturerId: UserId;
  name: string;
  startingCash: Rupiah;
}

const classForStudentsColumns = {
  id: classes.id,
  name: classes.name,
  lecturerName: users.name,
  startingCash: classes.startingCash,
};

const classStudentColumns = {
  id: users.id,
  name: users.name,
  username: users.username,
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

/** Lists the classes that a lecturer teaches, the newest first, with the number of students in each. */
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
    .orderBy(asc(classes.createdAt))
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
  return database
    .select(classStudentColumns)
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.studentId))
    .where(eq(memberships.classId, classId))
    .orderBy(asc(memberships.joinedAt), asc(memberships.id))
    .all()
    .map((student) => ({ ...student, name: nameOf(student) }));
}

/** Lists the classes that a student joined, in the order in which the student joined them. */
export function listJoinedClasses(
  database: Database,
  studentId: UserId,
): JoinedClass[] {
  return selectJoinedClasses(database)
    .where(eq(memberships.studentId, studentId))
    .orderBy(asc(memberships.joinedAt), asc(memberships.id))
    .all()
    .map(withLecturerName);
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
  return row === undefined ? undefined : withLecturerName(row);
}

/** Finds the class that a code opens, or undefined when no class has the code. */
export function findClassByJoinCode(
  database: Database,
  joinCode: JoinCode,
): ClassForStudents | undefined {
  const row = database
    .select(classForStudentsColumns)
    .from(classes)
    .innerJoin(users, eq(users.id, classes.lecturerId))
    .where(eq(classes.joinCode, joinCode))
    .get();
  return row === undefined ? undefined : withLecturerName(row);
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
    .select(classStudentColumns)
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.studentId))
    .where(
      and(
        eq(memberships.classId, classId),
        eq(memberships.studentId, studentId),
      ),
    )
    .get();
  return row === undefined ? undefined : { ...row, name: nameOf(row) };
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
    .innerJoin(users, eq(users.id, classes.lecturerId))
    .$dynamic();
}

function withLecturerName<Row extends { lecturerName: string | null }>(
  row: Row,
): Row & { lecturerName: string } {
  return { ...row, lecturerName: nameOf({ name: row.lecturerName }) };
}

// Only a lecturer whom the server owner created lacks a name, until the first sign-in. Such a lecturer teaches no class, and every student gives a name when joining, so a member of a class without a name is a broken database.
function nameOf({ name }: { name: string | null }): string {
  if (name === null) {
    throw new Error("A person in a class has no name.");
  }
  return name;
}
