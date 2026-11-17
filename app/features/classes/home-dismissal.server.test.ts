import { expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  createTestStudent,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import {
  createClassForTest,
  createLecturerWithClassForTest,
} from "./classes-for-test.server";
import { findJoinedClass, joinClass } from "./class-store.server";
import { memberships } from "./classes.schema";
import { dismissHomeSince, readHomeDismissedAt } from "./home-dismissal.server";
import { action } from "./class-page";

test("keeps the latest dismissal for one membership and deletes it with that membership", async () => {
  const database = openDatabaseForTest();
  const { classId, lecturerId } =
    await createLecturerWithClassForTest(database);
  const other = createClassForTest(database, lecturerId, "Kelas B");
  const studentId = await createTestStudent(database, "sari", "Sari");
  const otherStudentId = await createTestStudent(database, "eko", "Eko");
  const joinedAt = new Date("2026-11-02T03:00:00Z");
  joinClass(database, { classId, studentId }, joinedAt);
  joinClass(database, { classId: other.classId, studentId }, joinedAt);
  const joined = findJoinedClass(database, classId, studentId);
  const second = findJoinedClass(database, other.classId, studentId);
  if (joined === undefined || second === undefined)
    throw new Error("The student did not join both classes.");
  expect(readHomeDismissedAt(database, joined.membershipId)).toBeUndefined();
  const later = new Date("2026-11-02T04:00:00Z");
  dismissHomeSince(database, joined.membershipId, joinedAt);
  dismissHomeSince(database, joined.membershipId, later);
  expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(later);
  expect(readHomeDismissedAt(database, second.membershipId)).toBeUndefined();
  const context = readerContextForTest(database, {
    userId: studentId,
    now: later,
  });
  const path = `/classes/${String(classId)}?view=time`;
  const url = new URL(path, "http://localhost");
  const sent = {
    context,
    params: { classId: String(classId) },
    request: new Request(url, { method: "POST" }),
    url,
    pattern: "/classes/:classId",
  };
  const before = new Date();
  expect(() => action(sent)).toThrow(expect.objectContaining({ status: 302 }));
  const dismissed = readHomeDismissedAt(database, joined.membershipId);
  expect(dismissed?.getTime()).toBeGreaterThanOrEqual(before.getTime());
  expect(dismissed?.getTime()).toBeLessThanOrEqual(Date.now());
  expect(readHomeDismissedAt(database, second.membershipId)).toBeUndefined();
  for (const userId of [undefined, lecturerId, otherStudentId]) {
    expect(() =>
      action({
        ...sent,
        context: readerContextForTest(
          database,
          userId === undefined ? undefined : { userId, now: later },
        ),
      }),
    ).toThrow();
    expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
      dismissed,
    );
  }
  for (const invalidId of ["missing", "999999999"]) {
    expect(() => action({ ...sent, params: { classId: invalidId } })).toThrow();
    expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
      dismissed,
    );
  }
  database
    .delete(memberships)
    .where(eq(memberships.id, joined.membershipId))
    .run();
  expect(readHomeDismissedAt(database, joined.membershipId)).toBeUndefined();
});
