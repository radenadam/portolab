import type { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import {
  createReadyTestLecturer,
  createTestLecturer,
  createTestStudent,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import {
  joinClass,
  setFirstSessionDate,
} from "~/features/classes/class-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  createClassForTest,
  createClassWithoutCalendarForTest,
} from "~/features/classes/classes-for-test.server";
import {
  cookieOfForTest,
  openPageForTest,
} from "~/features/classes/last-class-for-test.server";
import { landingPath, readFrameReader } from "./frame-reader.server";

const now = new Date("2026-11-02T03:00:00.000Z");
const homeUrl = new URL("/", "http://localhost");

/** A request of the browser of a person to the home page with the cookie that the page of a class gave the browser. */
async function requestAfterOpening(
  context: RouterContextProvider,
  classId: ClassId,
): Promise<Request> {
  const setCookie = await openPageForTest(context, {
    path: `/classes/${String(classId)}`,
    params: { classId: String(classId) },
  });
  if (setCookie === undefined) {
    throw new Error(`The page of class ${String(classId)} set no cookie.`);
  }
  return new Request(homeUrl, {
    headers: { Cookie: cookieOfForTest(setCookie) },
  });
}

/** A lecturer with two classes, the first with the date of its first session and the second without one, as a class that Portolab created before it stored the date, and a student who joined the first and then the second. */
async function twoClasses(database: Database): Promise<{
  lecturerId: UserId;
  studentId: UserId;
  first: ClassId;
  second: ClassId;
}> {
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
  const first = createClassForTest(database, lecturerId, "Kelas A").classId;
  const second = createClassWithoutCalendarForTest(
    database,
    lecturerId,
    "Kelas B",
  );
  setFirstSessionDate(database, first, "2027-02-01");
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  joinClass(database, { classId: first, studentId }, now);
  joinClass(
    database,
    { classId: second, studentId },
    new Date("2026-11-03T03:00:00.000Z"),
  );
  return { lecturerId, studentId, first, second };
}

test("reads a visitor and a person who has not finished the account without a workspace", async () => {
  const database = openDatabaseForTest();
  expect(
    await readFrameReader(
      readerContextForTest(database, undefined),
      new Request(homeUrl),
      {},
    ),
  ).toEqual({ kind: "visitor" });
  const { account } = await createTestLecturer(database, "dosen");
  expect(
    await readFrameReader(
      readerContextForTest(database, { userId: account.id, now }),
      new Request(homeUrl),
      {},
    ),
  ).toEqual({ kind: "settingUp" });
});

test("reads a student with the classes that the student joined, each with its lecturer and its term, in the workspace of the class of the address", async () => {
  const database = openDatabaseForTest();
  const { studentId, first, second } = await twoClasses(database);
  const firstClass = {
    id: first,
    name: "Kelas A",
    term: {
      semester: "even",
      academicYear: { from: "2026-07-01", until: "2027-06-30" },
    },
    people: { kind: "lecturer", name: "Budi Santoso" },
  };
  const secondClass = {
    id: second,
    name: "Kelas B",
    term: undefined,
    people: { kind: "lecturer", name: "Budi Santoso" },
  };
  expect(
    await readFrameReader(
      readerContextForTest(database, { userId: studentId, now }),
      new Request(homeUrl),
      { classId: String(first) },
    ),
  ).toEqual({
    kind: "user",
    role: "student",
    name: "Sari Wulandari",
    workspace: { current: firstClass, classes: [firstClass, secondClass] },
  });
});

test("reads a lecturer with the classes that the lecturer teaches, each with the number of its students", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, first } = await twoClasses(database);
  const otherStudent = await createTestStudent(database, "rudi", "Rudi");
  joinClass(database, { classId: first, studentId: otherStudent }, now);
  const reader = await readFrameReader(
    readerContextForTest(database, { userId: lecturerId, now }),
    new Request(homeUrl),
    {},
  );
  expect(
    reader.kind === "user"
      ? reader.workspace?.classes.map(({ people }) => people)
      : undefined,
  ).toEqual([
    { kind: "students", count: 2 },
    { kind: "students", count: 1 },
  ]);
});

test("chooses the workspace from the class of the address, then from the class that the cookie names, then from the class that the person joined last", async () => {
  const database = openDatabaseForTest();
  const { studentId, first, second } = await twoClasses(database);
  const context = readerContextForTest(database, { userId: studentId, now });
  const afterFirst = await requestAfterOpening(context, first);
  const currentOf = async (
    request: Request,
    params: Record<string, string>,
  ): Promise<ClassId | undefined> => {
    const reader = await readFrameReader(context, request, params);
    return reader.kind === "user" ? reader.workspace?.current.id : undefined;
  };
  expect(await currentOf(afterFirst, { classId: String(second) })).toBe(second);
  expect(await currentOf(afterFirst, {})).toBe(first);
  // An address of a class that the person does not belong to chooses as a page without a class does.
  expect(await currentOf(afterFirst, { classId: "999" })).toBe(first);
  expect(await currentOf(new Request(homeUrl), {})).toBe(second);
});

test("reads a person without a class without a workspace", async () => {
  const database = openDatabaseForTest();
  const lecturerId = await createReadyTestLecturer(database, "dosen", "Budi");
  expect(
    await readFrameReader(
      readerContextForTest(database, { userId: lecturerId, now }),
      new Request(homeUrl),
      {},
    ),
  ).toEqual({
    kind: "user",
    role: "lecturer",
    name: "Budi",
    workspace: undefined,
  });
});

test("lands a person in the home of the class that the person opened last, else in the class that the person joined or created last", async () => {
  const database = openDatabaseForTest();
  const { lecturerId, studentId, first, second } = await twoClasses(database);
  const student = readerContextForTest(database, { userId: studentId, now });
  expect(
    await landingPath(
      student,
      await requestAfterOpening(student, first),
      homeUrl,
    ),
  ).toBe(`/classes/${String(first)}`);
  expect(await landingPath(student, new Request(homeUrl), homeUrl)).toBe(
    `/classes/${String(second)}`,
  );
  const lecturer = readerContextForTest(database, { userId: lecturerId, now });
  expect(
    await landingPath(
      lecturer,
      await requestAfterOpening(lecturer, first),
      homeUrl,
    ),
  ).toBe(`/classes/${String(first)}`);
  expect(await landingPath(lecturer, new Request(homeUrl), homeUrl)).toBe(
    `/classes/${String(second)}`,
  );
});

test("lands a student without a class on joining one, and a lecturer without a class on the form that creates one", async () => {
  const database = openDatabaseForTest();
  const lecturerId = await createReadyTestLecturer(database, "dosen", "Budi");
  const studentId = await createTestStudent(database, "sari", "Sari Wulandari");
  expect(
    await landingPath(
      readerContextForTest(database, { userId: studentId, now }),
      new Request(homeUrl),
      homeUrl,
    ),
  ).toBe("/join");
  expect(
    await landingPath(
      readerContextForTest(database, { userId: lecturerId, now }),
      new Request(homeUrl),
      homeUrl,
    ),
  ).toBe("/classes#create-class");
});

test("sends a person who has not finished the account to that step before landing", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  await expect(
    landingPath(
      readerContextForTest(database, { userId: account.id, now }),
      new Request(homeUrl),
      homeUrl,
    ),
  ).rejects.toMatchObject({ status: 302 });
});
