import { expect, test } from "vitest";
import { findAccountByUsername } from "~/features/accounts/account-store.server";
import { readerContextForTest } from "~/features/accounts/accounts-for-test.server";
import { usernameForTest } from "~/features/accounts/username-for-test";
import { listStudents } from "~/features/classes/class-store.server";
import {
  dismissHomeSince,
  readHomeDismissedAt,
} from "~/features/classes/home-dismissal.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { loader } from "./student-portfolio-page";

test("keeps the student's home dismissal state out of the lecturer's portfolio response", async () => {
  const { database, taughtClass } = await classOfStudentsForTest();
  const student = listStudents(database, taughtClass.id)[0];
  const lecturer = findAccountByUsername(database, usernameForTest("dosen"));
  if (student === undefined || lecturer === undefined)
    throw new Error("The class has no lecturer or student.");
  const now = new Date("2026-11-02T03:01:00Z");
  dismissHomeSince(database, student.membershipId, now);
  expect(readHomeDismissedAt(database, student.membershipId)).toEqual(now);
  const context = readerContextForTest(database, { userId: lecturer.id, now });
  context.set(priceSourceContext, fixturePriceSource);
  const url = new URL(
    `http://localhost/classes/${String(taughtClass.id)}/students/${String(student.id)}`,
  );
  const response = loader({
    context,
    url,
    request: new Request(url),
    params: { classId: String(taughtClass.id), studentId: String(student.id) },
    pattern: "/classes/:classId/students/:studentId",
  });
  expect(response.kind).toBe("portfolio");
  if (response.kind !== "portfolio")
    throw new Error("The holding fixture has no portfolio view.");
  expect(response.home).not.toHaveProperty("sinceOrders");
});
