import {
  createReadyTestLecturer,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { readHomePortfolio } from "~/features/trading/read-home-portfolio.server";
import { expect, test } from "vitest";
import { createClassForTest } from "~/features/classes/classes-for-test.server";
import { setStudentNim } from "~/features/classes/set-student-nim.server";
import { listStudents } from "~/features/classes/class-store.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { readAnonymousClassmates } from "./read-anonymous-classmates.server";

test("returns only anonymous coordinates, excludes the reader and unmeasured classmates, and reads no other class", async () => {
  const { database, taughtClass } = await classOfStudentsForTest();
  const students = listStudents(database, taughtClass.id);
  const reader = students.find(({ username }) => username === "eko");
  if (reader === undefined) throw new Error("The fixture has no Eko.");
  for (const student of students) {
    setStudentNim(database, {
      classId: taughtClass.id,
      studentId: student.id,
      nim: `PRIVATE-${student.username}`,
    });
  }
  const input = {
    classId: taughtClass.id,
    membershipId: reader.membershipId,
    startingCash: taughtClass.startingCash,
    request: new Request("http://localhost/classes/1"),
    now: new Date("2026-10-30T09:20:00Z"),
  };
  // read-class-portfolios.server.test.ts records the independent Python Decimal values for these same portfolios.
  expect(readAnonymousClassmates(database, input)).toEqual([
    {
      beta: closeToForTest(0.342191752088974, 14),
      return: closeToForTest(0.003259, 15),
    },
    {
      beta: closeToForTest(0.6206929278148288, 14),
      return: closeToForTest(-0.4522, 15),
    },
  ]);
  const context = readerContextForTest(database, {
    userId: reader.id,
    now: input.now,
  });
  context.set(priceSourceContext, fixturePriceSource);
  const home = readHomePortfolio(context, {
    ...input,
    url: new URL(input.request.url),
    classId: String(taughtClass.id),
    firstSessionDate: null,
  });
  expect(home.classmates).toEqual(readAnonymousClassmates(database, input));
  for (const classmate of home.classmates)
    expect(Object.keys(classmate)).toEqual(["beta", "return"]);
  for (const student of students) {
    expect(JSON.stringify(home)).not.toContain(student.name);
    expect(JSON.stringify(home)).not.toContain(`PRIVATE-${student.username}`);
  }
  const other = createClassForTest(
    database,
    await createReadyTestLecturer(database, "other", "Other"),
    "Other",
  );
  expect(
    readAnonymousClassmates(database, { ...input, classId: other.classId }),
  ).toEqual([]);
});
