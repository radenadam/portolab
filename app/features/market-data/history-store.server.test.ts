import { expect, test } from "vitest";
import { openTestDatabase } from "~/database/open-test-database.server";
import { indexPoints } from "~/units/index-points";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import {
  listCodesWithHistory,
  listDailyHistory,
  readLatestClose,
  replaceDailyHistory,
  saveDailyHistory,
} from "./history-store.server";
import type { DailyHistory, Instrument } from "./price-source.server";

// The closes of 28 to 30 October 2026, as Yahoo Finance returned them on 1 November 2026.
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const ihsg: Instrument = { kind: "index", code: "IHSG" };

function bbcaHistory(closes: readonly [string, number][]): DailyHistory {
  return {
    kind: "stock",
    code: "BBCA",
    closes: closes.map(([date, close]) => ({
      date,
      close: splitAdjustedRupiah(close),
    })),
  };
}

test("stores closes oldest first, and replaces a close of a date that it stored already", () => {
  const database = openTestDatabase();
  saveDailyHistory(
    database,
    bbcaHistory([
      ["2026-10-29", 4940],
      ["2026-10-28", 5275],
    ]),
  );
  saveDailyHistory(
    database,
    bbcaHistory([
      ["2026-10-29", 4940],
      ["2026-10-30", 4980],
    ]),
  );
  expect(listDailyHistory(database, bbca)).toEqual(
    bbcaHistory([
      ["2026-10-28", 5275],
      ["2026-10-29", 4940],
      ["2026-10-30", 4980],
    ]),
  );
  expect(readLatestClose(database, bbca)).toEqual({
    date: "2026-10-30",
    close: 4980,
  });
});

test("keeps the closes of an index apart from those of a stock", () => {
  const database = openTestDatabase();
  saveDailyHistory(database, bbcaHistory([["2026-10-30", 4980]]));
  saveDailyHistory(database, {
    kind: "index",
    code: "IHSG",
    closes: [{ date: "2026-10-30", close: indexPoints(5057.05) }],
  });
  expect(listDailyHistory(database, ihsg)).toEqual({
    kind: "index",
    code: "IHSG",
    closes: [{ date: "2026-10-30", close: 5057.05 }],
  });
  expect(readLatestClose(database, ihsg)).toEqual({
    date: "2026-10-30",
    close: 5057.05,
  });
  expect(listCodesWithHistory(database)).toEqual(new Set(["BBCA", "IHSG"]));
});

test("replaces every stored close of one instrument and keeps the others", () => {
  const database = openTestDatabase();
  saveDailyHistory(
    database,
    bbcaHistory([
      ["2026-10-28", 5275],
      ["2026-10-29", 4940],
    ]),
  );
  saveDailyHistory(database, {
    kind: "stock",
    code: "TLKM",
    closes: [{ date: "2026-10-29", close: splitAdjustedRupiah(1980) }],
  });
  // A split of one share into two halves every earlier close.
  replaceDailyHistory(
    database,
    bbcaHistory([
      ["2026-10-29", 2470],
      ["2026-10-30", 2490],
    ]),
  );
  expect(listDailyHistory(database, bbca)).toEqual(
    bbcaHistory([
      ["2026-10-29", 2470],
      ["2026-10-30", 2490],
    ]),
  );
  expect(readLatestClose(database, { kind: "stock", code: "TLKM" })).toEqual({
    date: "2026-10-29",
    close: 1980,
  });
});

test("has no latest close and no history for an instrument without stored closes", () => {
  const database = openTestDatabase();
  expect(readLatestClose(database, bbca)).toBeUndefined();
  expect(listDailyHistory(database, bbca)).toEqual(bbcaHistory([]));
  expect(listCodesWithHistory(database)).toEqual(new Set());
  saveDailyHistory(database, bbcaHistory([]));
  expect(listCodesWithHistory(database)).toEqual(new Set());
});
