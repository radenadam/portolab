import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  createReadyTestLecturer,
  createTestStudent,
} from "~/features/accounts/accounts-for-test.server";
import {
  findClassByJoinCode,
  findClassStudent,
  findJoinedClass,
  findTaughtClass,
  isReaderClass,
  joinClass,
  listReaderClasses,
  listStudents,
  setFirstSessionDate,
} from "./class-store.server";
import {
  createClassForTest,
  createLecturerWithClassForTest,
} from "./classes-for-test.server";

const now = new Date("2026-11-02T03:00:00.000Z");
const later = new Date("2026-11-02T04:00:00.000Z");

test("creates a class with a code of readable characters, which opens the class", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const taught = findTaughtClass(database, classId, lecturerId);
  expect(taught?.joinCode).toMatch(/^[a-km-np-z2-9]{8}$/);
  expect(
    taught === undefined
      ? undefined
      : findClassByJoinCode(database, taught.joinCode),
  ).toEqual({
    id: classId,
    name: "Manajemen Portofolio A",
    lecturerName: "Budi Santoso",
    startingCash: 100_000_000,
  });
});

test("shows a class only to the lecturer who teaches it and to its students", async () => {
  const database = openDatabaseForTest();
  const { classId } = await createLecturerWithClassForTest(database);
  const otherLecturerId = await createReadyTestLecturer(
    database,
    "dosen2",
    "Rina Hartono",
  );
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  const otherStudentId = await createTestStudent(
    database,
    "eko",
    "Eko Prasetyo",
  );
  joinClass(database, { classId, studentId }, later);
  expect(findTaughtClass(database, classId, otherLecturerId)).toBeUndefined();
  expect(findJoinedClass(database, classId, otherStudentId)).toBeUndefined();
  expect(findClassStudent(database, classId, otherStudentId)).toBeUndefined();
  const joined = findJoinedClass(database, classId, studentId);
  expect(joined).toMatchObject({
    id: classId,
    lecturerName: "Budi Santoso",
    joinedAt: later,
    firstSessionDate: "2026-09-07",
  });
  expect(findClassStudent(database, classId, studentId)).toEqual({
    id: studentId,
    name: "Sari Wulandari",
    username: "sari",
    membershipId: joined?.membershipId,
    joinedAt: later,
  });
});

test("adds a student to a class once, however often the student joins", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  joinClass(database, { classId, studentId }, now);
  joinClass(database, { classId, studentId }, later);
  expect(listStudents(database, classId)).toEqual([
    {
      id: studentId,
      name: "Sari Wulandari",
      username: "sari",
      membershipId: findJoinedClass(database, classId, studentId)?.membershipId,
      joinedAt: now,
    },
  ]);
  expect(
    listReaderClasses(database, { id: lecturerId, role: "lecturer" }),
  ).toMatchObject({
    role: "lecturer",
    classes: [{ id: classId, studentCount: 1 }],
  });
});

test("lists the classes of a lecturer with their students, and the classes of a student, in the order they began", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, classId: first } =
    await createLecturerWithClassForTest(database);
  const firstStudent = await createTestStudent(
    database,
    "sari",
    "Sari Wulandari",
  );
  const secondStudent = await createTestStudent(
    database,
    "eko",
    "Eko Prasetyo",
  );
  const second = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio B",
  ).classId;
  joinClass(database, { classId: second, studentId: firstStudent }, now);
  joinClass(database, { classId: first, studentId: firstStudent }, later);
  joinClass(database, { classId: first, studentId: secondStudent }, later);
  const taught = listReaderClasses(database, {
    id: lecturerId,
    role: "lecturer",
  });
  if (taught.role !== "lecturer") {
    throw new Error("The classes of a lecturer came as those of a student.");
  }
  expect(
    taught.classes.map(({ name, studentCount, firstSessionDate }) => ({
      name,
      studentCount,
      firstSessionDate,
    })),
  ).toEqual([
    {
      name: "Manajemen Portofolio A",
      studentCount: 2,
      firstSessionDate: "2026-09-07",
    },
    {
      name: "Manajemen Portofolio B",
      studentCount: 1,
      firstSessionDate: "2026-09-07",
    },
  ]);
  const joined = listReaderClasses(database, {
    id: firstStudent,
    role: "student",
  });
  expect(joined.role).toBe("student");
  expect(joined.classes.map(({ name }) => name)).toEqual([
    "Manajemen Portofolio B",
    "Manajemen Portofolio A",
  ]);
  // A role decides where an id counts, so the id of a student teaches no class.
  expect(
    listReaderClasses(database, { id: firstStudent, role: "lecturer" }).classes,
  ).toEqual([]);
});

test("finds that a lecturer teaches a class and a student joined it, and that no one else belongs to it", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  const otherStudentId = await createTestStudent(database, "eko", "Eko");
  const otherLecturerId = await createReadyTestLecturer(
    database,
    "dosen2",
    "Rina Hartono",
  );
  joinClass(database, { classId, studentId }, now);
  for (const [reader, belongs] of [
    [{ id: lecturerId, role: "lecturer" }, true],
    [{ id: studentId, role: "student" }, true],
    [{ id: otherLecturerId, role: "lecturer" }, false],
    [{ id: otherStudentId, role: "student" }, false],
    // A student and a lecturer have ids of one table, so the role decides where the id counts.
    [{ id: studentId, role: "lecturer" }, false],
  ] as const) {
    expect(
      isReaderClass(database, reader, classId),
      JSON.stringify(reader),
    ).toBe(belongs);
  }
});

test("keeps the date of session 1 that a class was created with, and changes it for that class alone", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const other = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio B",
  ).classId;
  expect(findTaughtClass(database, classId, lecturerId)?.firstSessionDate).toBe(
    "2026-09-07",
  );
  setFirstSessionDate(database, classId, "2026-09-12");
  expect(findTaughtClass(database, classId, lecturerId)?.firstSessionDate).toBe(
    "2026-09-12",
  );
  expect(findTaughtClass(database, other, lecturerId)?.firstSessionDate).toBe(
    "2026-09-07",
  );
});
