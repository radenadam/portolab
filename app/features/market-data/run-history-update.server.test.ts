import { expect, test } from "vitest";
import type { Database } from "~/database/database.server";
import { openTestDatabase } from "~/database/open-test-database.server";
import { fail, succeed } from "~/result";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { fixturePriceSource } from "./fixture-price-source.server";
import { listDailyHistory } from "./history-store.server";
import { runHistoryUpdate } from "./run-history-update.server";
import type { PriceSource } from "./price-source.server";
import type { Instrument } from "./price-source.server";
import { readLatestUpdateAttempt } from "./quote-store.server";

// The fixture source answers with the closes of 26 to 30 October 2026. The moments below follow the IDX calendar for a source with the delay of the fixture, whose price hours end at 16:25 WIB, so the closes of a trading day are final from 16:26 WIB.
const instruments: readonly Instrument[] = [
  { kind: "index", code: "IHSG" },
  { kind: "stock", code: "BBCA" },
  { kind: "stock", code: "BBRI" },
];
const bbca: Instrument = { kind: "stock", code: "BBCA" };
// 10:00 WIB on Monday 2 November 2026, when the latest final closes are those of Friday 30 October.
const mondayMorning = new Date("2026-11-02T03:00:00.000Z");
// 16:26 WIB on Monday 2 November 2026, when the closes of that Monday are final.
const mondayClose = new Date("2026-11-02T09:26:00.000Z");

interface Request {
  code: string;
  from: string;
}

/** A source that records each request for a history, and answers as the source that it wraps. */
function recordingSource(source: PriceSource): {
  source: PriceSource;
  requests: Request[];
} {
  const requests: Request[] = [];
  return {
    requests,
    source: {
      ...source,
      fetchDailyHistory: (instrument, from, signal) => {
        requests.push({ code: instrument.code, from });
        return source.fetchDailyHistory(instrument, from, signal);
      },
    },
  };
}

/** Runs the history update without waiting between requests, and counts the waits. */
async function updateHistory(
  database: Database,
  priceSource: PriceSource,
  options: { at: Date; instrumentsToTrack?: readonly Instrument[] },
): Promise<{ waits: number }> {
  let waits = 0;
  await runHistoryUpdate(
    {
      database,
      priceSource,
      instruments: options.instrumentsToTrack ?? instruments,
      historyStartDate: "2026-10-26",
    },
    options.at,
    {
      requestSignal: () => new AbortController().signal,
      waitBetweenRequests: () => {
        waits += 1;
        return Promise.resolve();
      },
    },
  );
  return { waits };
}

/** Answers like the fixture source, with one more close of BBCA on a later day. */
function sourceWithBbcaClose(date: string, close: number): PriceSource {
  return {
    ...fixturePriceSource,
    fetchDailyHistory: async (instrument, from, signal) => {
      const history = await fixturePriceSource.fetchDailyHistory(
        instrument,
        from,
        signal,
      );
      if (!history.ok || history.value.kind !== "stock") {
        return history;
      }
      return succeed({
        ...history.value,
        closes: [
          ...history.value.closes,
          { date, close: splitAdjustedRupiah(close) },
        ],
      });
    },
  };
}

test("stores the closes of every instrument from the start date, one request after another, and records a success", async () => {
  const database = openTestDatabase();
  const { source, requests } = recordingSource(fixturePriceSource);
  const { waits } = await updateHistory(database, source, {
    at: mondayMorning,
  });
  expect(requests).toEqual([
    { code: "IHSG", from: "2026-10-26" },
    { code: "BBCA", from: "2026-10-26" },
    { code: "BBRI", from: "2026-10-26" },
  ]);
  expect(waits).toBe(2);
  expect(listDailyHistory(database, bbca)).toEqual({
    kind: "stock",
    code: "BBCA",
    closes: [
      { date: "2026-10-26", close: 4940 },
      { date: "2026-10-27", close: 4900 },
      { date: "2026-10-28", close: 5275 },
      { date: "2026-10-29", close: 4940 },
      { date: "2026-10-30", close: 4980 },
    ],
  });
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: mondayMorning,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
  });
});

test("leaves out a close of a day whose prices can still change", async () => {
  const database = openTestDatabase();
  await updateHistory(database, sourceWithBbcaClose("2026-11-02", 5000), {
    at: mondayMorning,
  });
  const history = listDailyHistory(database, bbca);
  expect(history.closes.at(-1)).toEqual({ date: "2026-10-30", close: 4980 });
});

test("asks again only after the next close, from the latest stored close", async () => {
  const database = openTestDatabase();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  const { source, requests } = recordingSource(
    sourceWithBbcaClose("2026-11-02", 5000),
  );
  await updateHistory(database, source, {
    at: new Date("2026-11-02T09:25:00.000Z"),
  });
  expect(requests).toEqual([]);
  await updateHistory(database, source, { at: mondayClose });
  expect(requests).toEqual([
    { code: "IHSG", from: "2026-10-30" },
    { code: "BBCA", from: "2026-10-30" },
    { code: "BBRI", from: "2026-10-30" },
  ]);
  expect(listDailyHistory(database, bbca).closes.at(-1)).toEqual({
    date: "2026-11-02",
    close: 5000,
  });
});

test("fetches the whole history again when the source changed the latest stored close", async () => {
  const database = openTestDatabase();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  // After a split of one share into two, the source halves every earlier close of BBCA.
  const splitSource: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument, from) => {
      if (instrument.code !== "BBCA") {
        return fixturePriceSource.fetchDailyHistory(
          instrument,
          from,
          new AbortController().signal,
        );
      }
      const closes: [string, number][] = [
        ["2026-10-26", 2470],
        ["2026-10-27", 2450],
        ["2026-10-28", 2637.5],
        ["2026-10-29", 2470],
        ["2026-10-30", 2490],
        ["2026-11-02", 2500],
      ];
      return Promise.resolve(
        succeed({
          kind: "stock",
          code: "BBCA",
          closes: closes
            .filter(([date]) => date >= from)
            .map(([date, close]) => ({
              date,
              close: splitAdjustedRupiah(close),
            })),
        }),
      );
    },
  };
  const { source, requests } = recordingSource(splitSource);
  await updateHistory(database, source, { at: mondayClose });
  expect(requests).toContainEqual({ code: "BBCA", from: "2026-10-26" });
  expect(listDailyHistory(database, bbca).closes).toEqual([
    { date: "2026-10-26", close: 2470 },
    { date: "2026-10-27", close: 2450 },
    { date: "2026-10-28", close: 2637.5 },
    { date: "2026-10-29", close: 2470 },
    { date: "2026-10-30", close: 2490 },
    { date: "2026-11-02", close: 2500 },
  ]);
});

test("records the instruments that failed, waits, and then asks again only for them", async () => {
  const database = openTestDatabase();
  const failingBbri: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument, from, signal) =>
      instrument.code === "BBRI"
        ? Promise.resolve(fail("Yahoo Finance did not answer."))
        : fixturePriceSource.fetchDailyHistory(instrument, from, signal),
  };
  await updateHistory(database, failingBbri, { at: mondayMorning });
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: mondayMorning,
    succeeded: true,
    consecutiveFailures: 1,
    failedCodes: ["BBRI"],
  });
  const { source, requests } = recordingSource(fixturePriceSource);
  // After one failure, the backoff in update-schedule.ts waits one minute.
  await updateHistory(database, source, {
    at: new Date("2026-11-02T03:00:59.000Z"),
  });
  expect(requests).toEqual([]);
  await updateHistory(database, source, {
    at: new Date("2026-11-02T03:01:00.000Z"),
  });
  expect(requests).toEqual([{ code: "BBRI", from: "2026-10-26" }]);
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: new Date("2026-11-02T03:01:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
  });
});

test("counts a failure, a thrown error, and an answer without closes as failed instruments, and keeps their stored closes", async () => {
  const database = openTestDatabase();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  const brokenSource: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument) => {
      switch (instrument.code) {
        case "IHSG":
          return Promise.resolve(fail("Yahoo Finance did not answer."));
        case "BBCA":
          return Promise.reject(new Error("The network is down."));
        default:
          return Promise.resolve(
            succeed({ kind: "stock", code: instrument.code, closes: [] }),
          );
      }
    },
  };
  await updateHistory(database, brokenSource, { at: mondayClose });
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: mondayClose,
    succeeded: false,
    consecutiveFailures: 1,
    failedCodes: ["IHSG", "BBCA", "BBRI"],
  });
  expect(listDailyHistory(database, bbca).closes).toHaveLength(5);
});

test("asks between closes for an instrument that has no stored closes", async () => {
  const database = openTestDatabase();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  const { source, requests } = recordingSource(fixturePriceSource);
  await updateHistory(database, source, {
    at: new Date("2026-11-02T04:00:00.000Z"),
    instrumentsToTrack: [...instruments, { kind: "stock", code: "TLKM" }],
  });
  expect(requests).toEqual([{ code: "TLKM", from: "2026-10-26" }]);
});

test("takes every close before today as final on a date that no calendar covers", async () => {
  const database = openTestDatabase();
  const { source, requests } = recordingSource(
    sourceWithBbcaClose("2028-01-03", 5000),
  );
  // 10:00 WIB on 4 January 2028, which no calendar covers.
  const uncoveredMorning = new Date("2028-01-04T03:00:00.000Z");
  await updateHistory(database, source, { at: uncoveredMorning });
  expect(listDailyHistory(database, bbca).closes.at(-1)).toEqual({
    date: "2028-01-03",
    close: 5000,
  });
  requests.length = 0;
  await updateHistory(database, source, {
    at: new Date("2028-01-04T16:59:00.000Z"),
  });
  expect(requests).toEqual([]);
  // Midnight in WIB starts 5 January 2028, so the closes of 4 January count as final.
  await updateHistory(database, source, {
    at: new Date("2028-01-04T17:00:00.000Z"),
  });
  expect(requests).toHaveLength(instruments.length);
});

test("stops after three instruments in a row fail, and counts the instruments that it skipped as failed", async () => {
  const database = openTestDatabase();
  const { source, requests } = recordingSource({
    ...fixturePriceSource,
    fetchDailyHistory: () =>
      Promise.resolve(fail("Yahoo Finance did not answer.")),
  });
  const fiveInstruments: readonly Instrument[] = [
    ...instruments,
    { kind: "stock", code: "TLKM" },
    { kind: "stock", code: "ASII" },
  ];
  await updateHistory(database, source, {
    at: mondayMorning,
    instrumentsToTrack: fiveInstruments,
  });
  expect(requests.map((request) => request.code)).toEqual([
    "IHSG",
    "BBCA",
    "BBRI",
  ]);
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: mondayMorning,
    succeeded: false,
    consecutiveFailures: 1,
    failedCodes: ["IHSG", "BBCA", "BBRI", "TLKM", "ASII"],
  });
});

// Each state of the IDX schedule, with the latest update and a later moment, in WIB: whether the later moment asks for the closes again.
const scheduleStates: {
  name: string;
  updatedAt: string;
  laterAt: string;
  asksAgain: boolean;
}[] = [
  {
    name: "during the session after an update after the previous close",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T07:00:00.000Z",
    asksAgain: false,
  },
  {
    name: "in the last minute of the price hours",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T09:25:00.000Z",
    asksAgain: false,
  },
  {
    name: "in the first minute after the price hours",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T09:26:00.000Z",
    asksAgain: true,
  },
  {
    name: "on the weekend after an update after the Friday close",
    updatedAt: "2026-10-30T09:26:00.000Z",
    laterAt: "2026-11-01T03:00:00.000Z",
    asksAgain: false,
  },
  {
    name: "on a holiday after an update after the close of the day before",
    updatedAt: "2026-12-23T09:26:00.000Z",
    laterAt: "2026-12-24T09:30:00.000Z",
    asksAgain: false,
  },
  {
    name: "after the close of the first trading day after the holidays",
    updatedAt: "2026-12-23T09:26:00.000Z",
    laterAt: "2026-12-28T09:26:00.000Z",
    asksAgain: true,
  },
];

for (const state of scheduleStates) {
  test(`${state.asksAgain ? "asks again" : "asks nothing"} ${state.name}`, async () => {
    const database = openTestDatabase();
    await updateHistory(database, fixturePriceSource, {
      at: new Date(state.updatedAt),
    });
    const { source, requests } = recordingSource(fixturePriceSource);
    await updateHistory(database, source, { at: new Date(state.laterAt) });
    expect(requests).toHaveLength(state.asksAgain ? instruments.length : 0);
  });
}
