import { afterEach, expect, test } from "vitest";
import { closeDatabase, openDatabase } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { fail, succeed } from "~/result";
import { fixturePriceSource } from "./fixture-price-source.server";
import { createPriceUpdater, runPriceUpdate } from "./price-job.server";
import type { PriceSource } from "./price-source.server";
import {
  listLatestQuotes,
  readLatestUpdateAttempt,
} from "./quote-store.server";
import { trackedInstruments } from "./tracked-instruments";

const openDatabases: Database[] = [];

afterEach(() => {
  for (const database of openDatabases.splice(0)) {
    closeDatabase(database);
  }
});

function memoryDatabase(): Database {
  const database = openDatabase(":memory:");
  openDatabases.push(database);
  return database;
}

const failingSource: PriceSource = {
  fetchQuotes: () => Promise.resolve(fail("Yahoo Finance did not answer.")),
};
const emptySource: PriceSource = {
  fetchQuotes: () =>
    Promise.resolve(
      succeed({
        quotes: [],
        problems: ["Yahoo Finance returned no quote for BBCA."],
      }),
    ),
};
const throwingSource: PriceSource = {
  fetchQuotes: () => Promise.reject(new Error("The network is down.")),
};
// Answers like the fixture source, but without BBRI and TLKM.
const partialSource: PriceSource = {
  fetchQuotes: async (instruments) => {
    const answer = await fixturePriceSource.fetchQuotes(instruments);
    if (!answer.ok) {
      return answer;
    }
    return succeed({
      quotes: answer.value.quotes.filter(
        (quote) => quote.code !== "BBRI" && quote.code !== "TLKM",
      ),
      problems: [
        "Yahoo Finance returned no quote for BBRI.",
        "Yahoo Finance returned no quote for TLKM.",
      ],
    });
  },
};
const trackedCodes = trackedInstruments.map((instrument) => instrument.code);

const start = new Date("2026-11-02T03:00:00.000Z");

function minutesAfterStart(minutes: number): Date {
  return new Date(start.getTime() + minutes * 60_000);
}

test("stores the quotes and records a success", async () => {
  const database = memoryDatabase();
  await runPriceUpdate(
    {
      database,
      priceSource: fixturePriceSource,
      instruments: trackedInstruments,
    },
    start,
  );
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
  expect(readLatestUpdateAttempt(database)).toEqual({
    attemptedAt: start,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
  });
});

test("records the instruments that an answer lacks, without waiting before the next attempt", async () => {
  const database = memoryDatabase();
  await runPriceUpdate(
    {
      database,
      priceSource: partialSource,
      instruments: trackedInstruments,
    },
    start,
  );
  expect(listLatestQuotes(database)).toHaveLength(
    trackedInstruments.length - 2,
  );
  expect(readLatestUpdateAttempt(database)).toEqual({
    attemptedAt: start,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: ["BBRI", "TLKM"],
  });
});

test("counts a failure, an answer without a usable quote, and a thrown error as failures in a row", async () => {
  const database = memoryDatabase();
  const settings = { database, instruments: trackedInstruments };
  await runPriceUpdate({ ...settings, priceSource: failingSource }, start);
  await runPriceUpdate(
    { ...settings, priceSource: emptySource },
    minutesAfterStart(1),
  );
  await runPriceUpdate(
    { ...settings, priceSource: throwingSource },
    minutesAfterStart(3),
  );
  expect(readLatestUpdateAttempt(database)).toEqual({
    attemptedAt: minutesAfterStart(3),
    succeeded: false,
    consecutiveFailures: 3,
    failedCodes: trackedCodes,
  });
});

test("waits after failures, and a later run of the job keeps waiting, because the state lives in the database", async () => {
  const database = memoryDatabase();
  const settings = { database, instruments: trackedInstruments };
  await runPriceUpdate({ ...settings, priceSource: failingSource }, start);
  await runPriceUpdate(
    { ...settings, priceSource: failingSource },
    minutesAfterStart(1),
  );
  // After two failures in a row, the job waits two minutes.
  await runPriceUpdate(
    { ...settings, priceSource: fixturePriceSource },
    minutesAfterStart(2),
  );
  expect(listLatestQuotes(database)).toEqual([]);
  await runPriceUpdate(
    { ...settings, priceSource: fixturePriceSource },
    minutesAfterStart(3),
  );
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
  expect(readLatestUpdateAttempt(database)?.consecutiveFailures).toBe(0);
});

test("does nothing when an update starts while another one still runs", async () => {
  const database = memoryDatabase();
  let calls = 0;
  let answer: (() => void) | undefined;
  const slowSource: PriceSource = {
    fetchQuotes: async (instruments) => {
      calls += 1;
      await new Promise<void>((resolve) => {
        answer = resolve;
      });
      return fixturePriceSource.fetchQuotes(instruments);
    },
  };
  const updatePrices = createPriceUpdater({
    database,
    priceSource: slowSource,
    instruments: trackedInstruments,
  });
  const first = updatePrices();
  await updatePrices();
  answer?.();
  await first;
  expect(calls).toBe(1);
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
});
