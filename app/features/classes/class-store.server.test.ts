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
  joinClass,
  listJoinedClasses,
  listStudents,
  listTaughtClasses,
} from "./class-store.server";
import { createClassForTest } from "./classes-for-test.server";

const now = new Date("2026-11-02T03:00:00.000Z");
const later = new Date("2026-11-02T04:00:00.000Z");

test("creates a class with a code of eight readable characters, which opens the class", async () => {
  const database = openDatabaseForTest();
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
  const classId = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio A",
  ).classId;
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
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
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
  const classId = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio A",
  ).classId;
  joinClass(database, { classId, studentId }, later);
  expect(findTaughtClass(database, classId, otherLecturerId)).toBeUndefined();
  expect(findJoinedClass(database, classId, otherStudentId)).toBeUndefined();
  expect(findClassStudent(database, classId, otherStudentId)).toBeUndefined();
  expect(findJoinedClass(database, classId, studentId)).toMatchObject({
    id: classId,
    lecturerName: "Budi Santoso",
    joinedAt: later,
  });
  expect(findClassStudent(database, classId, studentId)).toEqual({
    id: studentId,
    name: "Sari Wulandari",
    username: "sari",
    joinedAt: later,
  });
});

test("adds a student to a class once, however often the student joins", async () => {
  const database = openDatabaseForTest();
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  const classId = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio A",
  ).classId;
  joinClass(database, { classId, studentId }, now);
  joinClass(database, { classId, studentId }, later);
  expect(listStudents(database, classId)).toEqual([
    { id: studentId, name: "Sari Wulandari", username: "sari", joinedAt: now },
  ]);
  expect(listTaughtClasses(database, lecturerId)).toMatchObject([
    { id: classId, studentCount: 1 },
  ]);
});

test("lists the classes of a lecturer with their students, and the classes of a student, in the order they began", async () => {
  const database = openDatabaseForTest();
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
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
  const first = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio A",
  ).classId;
  const second = createClassForTest(
    database,
    lecturerId,
    "Manajemen Portofolio B",
  ).classId;
  joinClass(database, { classId: second, studentId: firstStudent }, now);
  joinClass(database, { classId: first, studentId: firstStudent }, later);
  joinClass(database, { classId: first, studentId: secondStudent }, later);
  expect(
    listTaughtClasses(database, lecturerId).map(({ name, studentCount }) => ({
      name,
      studentCount,
    })),
  ).toEqual([
    { name: "Manajemen Portofolio A", studentCount: 2 },
    { name: "Manajemen Portofolio B", studentCount: 1 },
  ]);
  expect(
    listJoinedClasses(database, firstStudent).map(({ name }) => name),
  ).toEqual(["Manajemen Portofolio B", "Manajemen Portofolio A"]);
  expect(listTaughtClasses(database, firstStudent)).toEqual([]);
});
