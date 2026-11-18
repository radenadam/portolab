import { expect, test } from "vitest";
import {
  activityOrderForTest,
  filledActivityForTest,
  rejectedActivityForTest,
} from "./activity-for-test";
import { homeSinceOrders } from "./home-since-orders";

const filled = filledActivityForTest(1);
const rejected = rejectedActivityForTest(2);
const expired = activityOrderForTest(3, {
  state: { kind: "expired", expiredAt: new Date("2026-11-03T00:00:00Z") },
});
const now = new Date("2026-11-03T01:00:00Z");

test("lists fills, rejections, and expiries newest first before the first dismissal", () => {
  const cancelled = activityOrderForTest(4, {
    state: { kind: "cancelled", cancelledAt: now },
  });
  expect(
    homeSinceOrders([filled, rejected, expired, cancelled], undefined, now),
  ).toEqual([expired, rejected, filled]);
  expect(homeSinceOrders([], undefined, now)).toEqual([]);
});

test("includes an outcome just after dismissal and excludes it at or before dismissal", () => {
  const moments = [
    { order: filled, moment: new Date("2026-11-02T03:00:00Z") },
    { order: rejected, moment: new Date("2026-11-02T03:01:00Z") },
    { order: expired, moment: expired.expiresAt },
  ];
  for (const { order, moment } of moments) {
    expect(
      homeSinceOrders([order], new Date(moment.getTime() - 1), now),
    ).toEqual([order]);
    expect(homeSinceOrders([order], moment, now)).toEqual([]);
    expect(
      homeSinceOrders([order], new Date(moment.getTime() + 1), now),
    ).toEqual([]);
    expect(
      homeSinceOrders([order], undefined, new Date(moment.getTime() - 1)),
    ).toEqual([]);
    expect(homeSinceOrders([order], undefined, moment)).toEqual([order]);
  }
});

test("uses the processing time of a fill even when its delayed quote preceded dismissal", () => {
  const dismissedAt = new Date("2026-11-02T02:55:00Z");
  expect(
    filled.state.kind === "filled" && filled.state.fill.quotedAt < dismissedAt,
  ).toBe(true);
  expect(homeSinceOrders([filled], dismissedAt, now)).toEqual([filled]);
});

test("derives an expiry from its deadline before a job stores it and never repeats it when the job runs", () => {
  const waiting = activityOrderForTest(5);
  const resting = activityOrderForTest(6, { state: { kind: "resting" } });
  const deadline = waiting.expiresAt;
  expect(
    homeSinceOrders(
      [waiting, resting],
      undefined,
      new Date(deadline.getTime() - 1),
    ),
  ).toEqual([]);
  expect(homeSinceOrders([waiting, resting], undefined, deadline)).toEqual([
    resting,
    waiting,
  ]);
  expect(homeSinceOrders([waiting, resting, expired], deadline, now)).toEqual(
    [],
  );
});
