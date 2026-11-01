import { expect, test, vi } from "vitest";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { fail, succeed } from "~/result";
import { fixturePriceSource } from "./fixture-price-source.server";
import { runQuoteUpdate, serializeUpdates } from "./price-job.server";
import type { PriceJobSettings } from "./price-job-settings";
import type { PriceSource } from "./price-source.server";
import { listLatestQuotes } from "./quote-store.server";
import { readLatestUpdateAttempt } from "./update-attempts.server";
import { trackedInstruments } from "./tracked-instruments";

const failingSource: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: () => Promise.resolve(fail("Yahoo Finance did not answer.")),
};
const emptySource: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: () =>
    Promise.resolve(
      succeed({
        quotes: [],
        problems: ["Yahoo Finance returned no quote for BBCA."],
      }),
    ),
};
const throwingSource: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: () => Promise.reject(new Error("The network is down.")),
};
// Answers like the fixture source, but without BBRI and TLKM.
const partialSource: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: async (instruments, signal) => {
    const answer = await fixturePriceSource.fetchQuotes(instruments, signal);
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

function jobSettings(
  database: Database,
  priceSource: PriceSource,
): PriceJobSettings {
  return {
    database,
    priceSource,
    instruments: trackedInstruments,
    historyStartDate: "2026-10-26",
  };
}

/** Updates the tracked prices from a source at a moment, with a signal that never aborts unless the test gives one. */
function updateFrom(
  database: Database,
  priceSource: PriceSource,
  options: { at: Date; signal?: AbortSignal },
): Promise<void> {
  return runQuoteUpdate(
    jobSettings(database, priceSource),
    options.at,
    options.signal ?? new AbortController().signal,
  );
}

test("stores the quotes and records a success", async () => {
  const database = openDatabaseForTest();
  await updateFrom(database, fixturePriceSource, { at: start });
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
  expect(readLatestUpdateAttempt(database, "quotes")).toEqual({
    attemptedAt: start,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
  });
});

test("records the instruments that an answer lacks, without waiting before the next attempt", async () => {
  const database = openDatabaseForTest();
  await updateFrom(database, partialSource, { at: start });
  expect(listLatestQuotes(database)).toHaveLength(
    trackedInstruments.length - 2,
  );
  expect(readLatestUpdateAttempt(database, "quotes")).toEqual({
    attemptedAt: start,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: ["BBRI", "TLKM"],
  });
});

test("counts a failure, an answer without a usable quote, and a thrown error as failures in a row", async () => {
  const database = openDatabaseForTest();
  await updateFrom(database, failingSource, { at: start });
  await updateFrom(database, emptySource, { at: minutesAfterStart(1) });
  await updateFrom(database, throwingSource, { at: minutesAfterStart(3) });
  expect(readLatestUpdateAttempt(database, "quotes")).toEqual({
    attemptedAt: minutesAfterStart(3),
    succeeded: false,
    consecutiveFailures: 3,
    failedCodes: trackedCodes,
  });
});

test("records a failure when the job stops waiting for the price source", async () => {
  const database = openDatabaseForTest();
  const stalledSource: PriceSource = {
    ...fixturePriceSource,
    fetchQuotes: (_instruments, signal) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => {
          resolve(fail("Yahoo Finance did not answer in time."));
        });
      }),
  };
  const controller = new AbortController();
  const update = updateFrom(database, stalledSource, {
    at: start,
    signal: controller.signal,
  });
  controller.abort();
  await update;
  expect(readLatestUpdateAttempt(database, "quotes")).toEqual({
    attemptedAt: start,
    succeeded: false,
    consecutiveFailures: 1,
    failedCodes: trackedCodes,
  });
});

test("waits after failures, and a later run of the job keeps waiting, because the state lives in the database", async () => {
  const database = openDatabaseForTest();
  await updateFrom(database, failingSource, { at: start });
  await updateFrom(database, failingSource, { at: minutesAfterStart(1) });
  // After two failures in a row, the backoff in update-schedule.ts makes this attempt too early.
  await updateFrom(database, fixturePriceSource, { at: minutesAfterStart(2) });
  expect(listLatestQuotes(database)).toEqual([]);
  await updateFrom(database, fixturePriceSource, { at: minutesAfterStart(3) });
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
  expect(readLatestUpdateAttempt(database, "quotes")?.consecutiveFailures).toBe(
    0,
  );
});

test("runs one more update right after the current one when asked during it, and never two at once", async () => {
  const database = openDatabaseForTest();
  const answers: (() => void)[] = [];
  let running = 0;
  let mostAtOnce = 0;
  const slowSource: PriceSource = {
    ...fixturePriceSource,
    fetchQuotes: async (instruments, signal) => {
      running += 1;
      mostAtOnce = Math.max(mostAtOnce, running);
      await new Promise<void>((resolve) => {
        answers.push(resolve);
      });
      running -= 1;
      return fixturePriceSource.fetchQuotes(instruments, signal);
    },
  };
  const updatePrices = serializeUpdates(
    () =>
      runQuoteUpdate(
        jobSettings(database, slowSource),
        new Date(),
        new AbortController().signal,
      ),
    "The quote update failed.",
  );
  const first = updatePrices();
  // Two runs of the schedule arrive while the first update waits for its answer.
  await updatePrices();
  await updatePrices();
  answers[0]?.();
  await vi.waitFor(() => {
    expect(answers).toHaveLength(2);
  });
  answers[1]?.();
  await first;
  expect(answers).toHaveLength(2);
  expect(mostAtOnce).toBe(1);
  expect(listLatestQuotes(database)).toHaveLength(trackedInstruments.length);
});
