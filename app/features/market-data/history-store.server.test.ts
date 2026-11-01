import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { buildDailyHistory } from "./build-daily-history";
import {
  listCodesWithHistory,
  listDailyHistory,
  saveDailyHistory,
} from "./history-store.server";
import type { Instrument } from "./price-source.server";

// The closes of 28 to 30 October 2026, as Yahoo Finance returned them on 1 November 2026.
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const ihsg: Instrument = { kind: "index", code: "IHSG" };

test("stores closes oldest first, and replaces a close of a date that it stored already", () => {
  const database = openDatabaseForTest();
  saveDailyHistory(
    database,
    buildDailyHistory(bbca, [
      ["2026-10-29", 4940],
      ["2026-10-28", 5275],
    ]),
  );
  // After a split of one share into two, the source halves the earlier closes.
  saveDailyHistory(
    database,
    buildDailyHistory(bbca, [
      ["2026-10-29", 2470],
      ["2026-10-30", 2490],
    ]),
  );
  expect(listDailyHistory(database, bbca)).toEqual(
    buildDailyHistory(bbca, [
      ["2026-10-28", 5275],
      ["2026-10-29", 2470],
      ["2026-10-30", 2490],
    ]),
  );
});

test("keeps the closes of an index apart from those of a stock", () => {
  const database = openDatabaseForTest();
  saveDailyHistory(database, buildDailyHistory(bbca, [["2026-10-30", 4980]]));
  saveDailyHistory(
    database,
    buildDailyHistory(ihsg, [["2026-10-30", 5057.05]]),
  );
  expect(listDailyHistory(database, ihsg)).toEqual(
    buildDailyHistory(ihsg, [["2026-10-30", 5057.05]]),
  );
  expect(listDailyHistory(database, bbca)).toEqual(
    buildDailyHistory(bbca, [["2026-10-30", 4980]]),
  );
  expect(listCodesWithHistory(database)).toEqual(new Set(["BBCA", "IHSG"]));
});

test("has no history for an instrument without stored closes, and stores nothing from a history without closes", () => {
  const database = openDatabaseForTest();
  expect(listDailyHistory(database, bbca)).toEqual(buildDailyHistory(bbca, []));
  saveDailyHistory(database, buildDailyHistory(bbca, []));
  expect(listCodesWithHistory(database)).toEqual(new Set());
});
