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
import { homeSummaryTimeField } from "~/features/trading/home-summary-time";
import {
  filledActivityForTest,
  soldActivityForTest,
  activityOrderForTest,
} from "~/features/trading/activity-for-test";
import { homeSinceOrders } from "~/features/trading/home-since-orders";
import { limitForTest } from "~/features/trading/orders-for-test";
import { rupiah } from "~/units/rupiah";

test("closes only the loaded summary, keeps intervening fills and expiries, and never moves a membership cutoff backward", async () => {
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
  const shownAt = new Date("2026-11-02T03:30:00Z");
  const context = readerContextForTest(database, {
    userId: studentId,
    now: shownAt,
  });
  const path = `/classes/${String(classId)}?view=time`;
  const url = new URL(path, "http://localhost");
  const sent = () => ({
    context,
    params: { classId: String(classId) },
    url,
    request: new Request(url, {
      method: "POST",
      body: new URLSearchParams({
        [homeSummaryTimeField]: shownAt.toISOString(),
      }),
    }),
    pattern: "/classes/:classId",
  });
  const oldFill = filledActivityForTest(1);
  const newFill = {
    ...soldActivityForTest(2, {
      quotedAt: new Date("2026-11-02T03:30:00Z"),
      filledAt: new Date("2026-11-02T03:40:00Z"),
    }),
    placedAt: new Date("2026-11-02T03:10:00Z"),
    price: limitForTest(5_100),
    checkedPrice: rupiah(5_100),
  };
  const expiry = activityOrderForTest(3, {
    placedAt: new Date("2026-11-02T03:15:00Z"),
    price: limitForTest(4_640),
    state: { kind: "resting" },
  });
  const outcomes = [oldFill, newFill, expiry];
  expect(homeSinceOrders(outcomes, undefined, shownAt)).toEqual([oldFill]);
  expect(new Date() > expiry.expiresAt).toBe(true);
  await expect(action(sent())).rejects.toMatchObject({ status: 302 });
  expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(shownAt);
  expect(
    homeSinceOrders(
      outcomes,
      readHomeDismissedAt(database, joined.membershipId),
      new Date(),
    ),
  ).toEqual([expiry, newFill]);
  expect(readHomeDismissedAt(database, second.membershipId)).toBeUndefined();
  const newerSnapshot = new Date("2026-11-02T04:00:00Z");
  dismissHomeSince(database, joined.membershipId, newerSnapshot);
  await expect(action(sent())).rejects.toMatchObject({ status: 302 });
  expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
    newerSnapshot,
  );
  for (const userId of [undefined, lecturerId, otherStudentId]) {
    await expect(
      action({
        ...sent(),
        context: readerContextForTest(
          database,
          userId === undefined ? undefined : { userId, now: shownAt },
        ),
      }),
    ).rejects.toMatchObject(
      userId === undefined ? { status: 302 } : { init: { status: 404 } },
    );
    expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
      newerSnapshot,
    );
  }
  for (const invalidId of ["missing", "999999999"]) {
    await expect(
      action({ ...sent(), params: { classId: invalidId } }),
    ).rejects.toMatchObject({ init: { status: 404 } });
    expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
      newerSnapshot,
    );
  }
  const invalid = await action({
    ...sent(),
    request: new Request(url, {
      method: "POST",
      body: new URLSearchParams({ [homeSummaryTimeField]: "bad" }),
    }),
  });
  expect(invalid.init?.status).toBe(400);
  expect(readHomeDismissedAt(database, joined.membershipId)).toEqual(
    newerSnapshot,
  );
  database
    .delete(memberships)
    .where(eq(memberships.id, joined.membershipId))
    .run();
  expect(readHomeDismissedAt(database, joined.membershipId)).toBeUndefined();
});
