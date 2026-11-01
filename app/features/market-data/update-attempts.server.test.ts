import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  readLatestUpdateAttempt,
  saveUpdateAttempt,
} from "./update-attempts.server";

test("keeps only the latest attempt of each job, with the codes that it could not update and the final day that it asked for", () => {
  const database = openDatabaseForTest();
  expect(readLatestUpdateAttempt(database, "quotes")).toBeUndefined();
  expect(readLatestUpdateAttempt(database, "history")).toBeUndefined();
  saveUpdateAttempt(database, "quotes", {
    attemptedAt: new Date("2026-10-30T09:29:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
  });
  saveUpdateAttempt(database, "quotes", {
    attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: ["BBRI", "TLKM"],
  });
  saveUpdateAttempt(database, "history", {
    attemptedAt: new Date("2026-10-30T09:26:00.000Z"),
    succeeded: false,
    consecutiveFailures: 2,
    failedCodes: ["IHSG", "BBCA"],
    finalDate: "2026-10-30",
  });
  expect(readLatestUpdateAttempt(database, "quotes")).toEqual({
    attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: ["BBRI", "TLKM"],
  });
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: new Date("2026-10-30T09:26:00.000Z"),
    succeeded: false,
    consecutiveFailures: 2,
    failedCodes: ["IHSG", "BBCA"],
    finalDate: "2026-10-30",
  });
});
