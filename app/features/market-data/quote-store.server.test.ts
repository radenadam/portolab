import { expect, test } from "vitest";
import { openTestDatabase } from "~/database/open-test-database.server";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import {
  listLatestQuotes,
  readLatestUpdateAttempt,
  saveQuotes,
  saveUpdateAttempt,
} from "./quote-store.server";

test("keeps only the latest quote of each instrument, the indices first", () => {
  const database = openTestDatabase();
  const quotedAt = new Date("2026-10-30T09:14:55.000Z");
  saveQuotes(
    database,
    [
      {
        kind: "stock",
        code: "BBCA",
        price: rupiah(4940),
        previousClose: rupiah(4900),
        quotedAt,
      },
    ],
    quotedAt,
  );
  saveQuotes(
    database,
    [
      {
        kind: "stock",
        code: "BBCA",
        price: rupiah(4980),
        previousClose: rupiah(4940),
        quotedAt,
      },
      {
        kind: "index",
        code: "IHSG",
        level: indexPoints(5057.05),
        previousLevel: indexPoints(5098.06),
        quotedAt,
      },
    ],
    quotedAt,
  );
  expect(listLatestQuotes(database)).toEqual([
    {
      kind: "index",
      code: "IHSG",
      level: indexPoints(5057.05),
      previousLevel: indexPoints(5098.06),
      quotedAt,
    },
    {
      kind: "stock",
      code: "BBCA",
      price: 4980,
      previousClose: 4940,
      quotedAt,
    },
  ]);
});

test("keeps only the latest attempt of each job, with the codes that it could not update", () => {
  const database = openTestDatabase();
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
  });
});
