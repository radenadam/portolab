import { afterEach, expect, test, vi } from "vitest";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { fail, succeed } from "~/result";
import { writeLog } from "~/write-log.server";
import { buildDailyHistory } from "./build-daily-history";
import { fixturePriceSource } from "./fixture-price-source.server";
import { listDailyHistory } from "./history-store.server";
import type { Instrument, PriceSource } from "./price-source.server";
import { runHistoryUpdate } from "./run-history-update.server";
import { trackedInstruments } from "./tracked-instruments";
import { readLatestUpdateAttempt } from "./update-attempts.server";
import type { UpdateAttempt } from "./update-attempts.server";

// The log is replaced, so a test can read the texts that the history update writes.
vi.mock("~/write-log.server");

afterEach(() => {
  vi.mocked(writeLog).mockClear();
});

// The fixture source answers with the closes of 26 to 30 October 2026. The moments below follow the IDX calendar for a source with the delay of the fixture, whose price hours end at 16:25 WIB, so the closes of a trading day are final from 16:26 WIB.
const instruments: readonly Instrument[] = [
  { kind: "index", code: "IHSG" },
  { kind: "stock", code: "BBCA" },
  { kind: "stock", code: "BBRI" },
];
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const historyStartDate = "2026-10-26";
// 10:00 WIB on Monday 2 November 2026, when the latest final closes are those of Friday 30 October.
const mondayMorning = new Date("2026-11-02T03:00:00.000Z");
// 16:26 WIB on Monday 2 November 2026, when the closes of that Monday are final.
const mondayClose = new Date("2026-11-02T09:26:00.000Z");

/** The attempt of a run in which the instruments failed for the first time, which are all three unless the test names others. */
function firstFailure(
  attemptedAt: Date,
  finalDate: string,
  failedCodes: readonly string[] = ["IHSG", "BBCA", "BBRI"],
): UpdateAttempt {
  return {
    attemptedAt,
    succeeded: false,
    consecutiveFailures: 1,
    failedCodes: [...failedCodes],
    finalDate,
  };
}

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

/** Answers like the fixture source, with a close on each later date for every instrument, at its close of 30 October. */
function sourceWithLaterCloses(dates: readonly string[]): PriceSource {
  return {
    ...fixturePriceSource,
    fetchDailyHistory: async (instrument, from, signal) => {
      const history = await fixturePriceSource.fetchDailyHistory(
        instrument,
        from,
        signal,
      );
      if (!history.ok) {
        return history;
      }
      const closes: [string, number][] = [];
      for (const close of history.value.closes) {
        closes.push([close.date, close.close]);
      }
      const lastClose = closes.at(-1)?.[1] ?? 0;
      for (const date of dates) {
        closes.push([date, lastClose]);
      }
      return succeed(buildDailyHistory(instrument, closes));
    },
  };
}

/** Runs the history update without waiting between requests, and counts the waits. A list of moments gives the clock one moment for each reading, so a run can take time. */
async function updateHistory(
  database: Database,
  priceSource: PriceSource,
  options: {
    at: Date | readonly Date[];
    instrumentsToTrack?: readonly Instrument[];
    requestSignal?: () => AbortSignal;
  },
): Promise<{ waits: number }> {
  let waits = 0;
  const moments = options.at instanceof Date ? [options.at] : [...options.at];
  const lastMoment = moments.at(-1);
  if (lastMoment === undefined) {
    throw new Error("The test must give the history update a moment.");
  }
  await runHistoryUpdate(
    {
      database,
      priceSource,
      instruments: options.instrumentsToTrack ?? instruments,
      historyStartDate,
    },
    () => moments.shift() ?? lastMoment,
    {
      requestSignal:
        options.requestSignal ?? (() => new AbortController().signal),
      waitBetweenRequests: () => {
        waits += 1;
        return Promise.resolve();
      },
    },
  );
  return { waits };
}

test("stores the closes of every instrument from the start date, one request after another, and records a success", async () => {
  const database = openDatabaseForTest();
  const { source, requests } = recordingSource(fixturePriceSource);
  const { waits } = await updateHistory(database, source, {
    at: mondayMorning,
  });
  expect(requests).toEqual([
    { code: "IHSG", from: historyStartDate },
    { code: "BBCA", from: historyStartDate },
    { code: "BBRI", from: historyStartDate },
  ]);
  expect(waits).toBe(2);
  expect(listDailyHistory(database, bbca)).toEqual(
    buildDailyHistory(bbca, [
      ["2026-10-26", 4940],
      ["2026-10-27", 4900],
      ["2026-10-28", 5275],
      ["2026-10-29", 4940],
      ["2026-10-30", 4980],
    ]),
  );
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: mondayMorning,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
    finalDate: "2026-10-30",
  });
});

test("gets an answer from the fixture source for every tracked instrument", async () => {
  const database = openDatabaseForTest();
  await updateHistory(database, fixturePriceSource, {
    at: mondayMorning,
    instrumentsToTrack: trackedInstruments,
  });
  expect(readLatestUpdateAttempt(database, "history")?.failedCodes).toEqual([]);
});

test("leaves out a close of a day whose prices can still change", async () => {
  const database = openDatabaseForTest();
  await updateHistory(database, sourceWithLaterCloses(["2026-11-02"]), {
    at: mondayMorning,
  });
  expect(listDailyHistory(database, bbca).closes.at(-1)).toEqual({
    date: "2026-10-30",
    close: 4980,
  });
});

test("asks again for the whole history only after the next close", async () => {
  const database = openDatabaseForTest();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  const { source, requests } = recordingSource(
    sourceWithLaterCloses(["2026-11-02"]),
  );
  await updateHistory(database, source, {
    at: new Date("2026-11-02T09:25:00.000Z"),
  });
  expect(requests).toEqual([]);
  await updateHistory(database, source, { at: mondayClose });
  expect(requests).toEqual([
    { code: "IHSG", from: historyStartDate },
    { code: "BBCA", from: historyStartDate },
    { code: "BBRI", from: historyStartDate },
  ]);
  expect(listDailyHistory(database, bbca).closes.at(-1)).toEqual({
    date: "2026-11-02",
    close: 4980,
  });
});

test("stores the adjusted closes of a split that the source applies days later", async () => {
  const database = openDatabaseForTest();
  await updateHistory(database, sourceWithLaterCloses(["2026-11-02"]), {
    at: mondayClose,
  });
  // A split of one share into two took effect on 2 November, and the source halved the earlier closes of BBCA only on 3 November.
  const adjustedBbca = buildDailyHistory(bbca, [
    ["2026-10-26", 2470],
    ["2026-10-27", 2450],
    ["2026-10-28", 2637.5],
    ["2026-10-29", 2470],
    ["2026-10-30", 2490],
    ["2026-11-02", 2490],
    ["2026-11-03", 2500],
  ]);
  const laterSource = sourceWithLaterCloses(["2026-11-02", "2026-11-03"]);
  const splitSource: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument, from, signal) =>
      instrument.code === "BBCA"
        ? Promise.resolve(succeed(adjustedBbca))
        : laterSource.fetchDailyHistory(instrument, from, signal),
  };
  await updateHistory(database, splitSource, {
    at: new Date("2026-11-03T09:26:00.000Z"),
  });
  expect(listDailyHistory(database, bbca)).toEqual(adjustedBbca);
});

test("counts an answer without the close of the latest trading day as a failure, and asks again after the wait", async () => {
  const database = openDatabaseForTest();
  // The fixture has no close of Monday 2 November, so its answers after that close are stale.
  await updateHistory(database, fixturePriceSource, { at: mondayClose });
  expect(readLatestUpdateAttempt(database, "history")).toEqual(
    firstFailure(mondayClose, "2026-11-02"),
  );
  const { source, requests } = recordingSource(
    sourceWithLaterCloses(["2026-11-02"]),
  );
  await updateHistory(database, source, {
    at: new Date("2026-11-02T09:27:00.000Z"),
  });
  expect(requests).toHaveLength(instruments.length);
  expect(readLatestUpdateAttempt(database, "history")?.failedCodes).toEqual([]);
});

test("records the instruments that failed, waits from the end of the run, and then asks again only for them", async () => {
  const database = openDatabaseForTest();
  const failingBbri: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument, from, signal) =>
      instrument.code === "BBRI"
        ? Promise.resolve(fail("Yahoo Finance did not answer."))
        : fixturePriceSource.fetchDailyHistory(instrument, from, signal),
  };
  // The run starts at 10:00 WIB and ends at 10:01:30 WIB.
  const runEnd = new Date("2026-11-02T03:01:30.000Z");
  await updateHistory(database, failingBbri, { at: [mondayMorning, runEnd] });
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: runEnd,
    succeeded: true,
    consecutiveFailures: 1,
    failedCodes: ["BBRI"],
    finalDate: "2026-10-30",
  });
  const { source, requests } = recordingSource(fixturePriceSource);
  // After one failure, the backoff in update-schedule.ts waits one minute from the minute in which the run ended.
  await updateHistory(database, source, {
    at: new Date("2026-11-02T03:01:59.000Z"),
  });
  expect(requests).toEqual([]);
  const retryAt = new Date("2026-11-02T03:02:00.000Z");
  await updateHistory(database, source, { at: retryAt });
  expect(requests).toEqual([{ code: "BBRI", from: historyStartDate }]);
  expect(readLatestUpdateAttempt(database, "history")).toEqual({
    attemptedAt: retryAt,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
    finalDate: "2026-10-30",
  });
});

test("counts a failure, a thrown error, and an answer without closes as failed instruments, and keeps their stored closes", async () => {
  const database = openDatabaseForTest();
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
          return Promise.resolve(succeed(buildDailyHistory(instrument, [])));
      }
    },
  };
  await updateHistory(database, brokenSource, { at: mondayClose });
  expect(readLatestUpdateAttempt(database, "history")).toEqual(
    firstFailure(mondayClose, "2026-11-02"),
  );
  expect(listDailyHistory(database, bbca).closes).toHaveLength(5);
});

test("records a failure when the job stops waiting for a request, and gives each request its own signal", async () => {
  const database = openDatabaseForTest();
  const stalledSource: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (_instrument, _from, signal) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => {
          resolve(fail("Yahoo Finance did not answer in time."));
        });
      }),
  };
  const signals: AbortSignal[] = [];
  await updateHistory(database, stalledSource, {
    at: mondayMorning,
    requestSignal: () => {
      const controller = new AbortController();
      signals.push(controller.signal);
      // The job stops waiting for the request right after it starts.
      setTimeout(() => {
        controller.abort();
      }, 0);
      return controller.signal;
    },
  });
  expect(new Set(signals).size).toBe(instruments.length);
  expect(readLatestUpdateAttempt(database, "history")).toEqual(
    firstFailure(mondayMorning, "2026-10-30"),
  );
});

test("stops after three instruments in a row fail, and counts the instruments that it skipped as failed", async () => {
  const database = openDatabaseForTest();
  const { source, requests } = recordingSource({
    ...fixturePriceSource,
    fetchDailyHistory: () =>
      Promise.resolve(fail("Yahoo Finance did not answer.")),
  });
  await updateHistory(database, source, {
    at: mondayMorning,
    instrumentsToTrack: [
      ...instruments,
      { kind: "stock", code: "TLKM" },
      { kind: "stock", code: "ASII" },
    ],
  });
  expect(requests.map((request) => request.code)).toEqual([
    "IHSG",
    "BBCA",
    "BBRI",
  ]);
  expect(readLatestUpdateAttempt(database, "history")).toEqual(
    firstFailure(mondayMorning, "2026-10-30", [
      "IHSG",
      "BBCA",
      "BBRI",
      "TLKM",
      "ASII",
    ]),
  );
});

test("asks between closes for an instrument that has no stored closes", async () => {
  const database = openDatabaseForTest();
  await updateHistory(database, fixturePriceSource, { at: mondayMorning });
  const { source, requests } = recordingSource(fixturePriceSource);
  await updateHistory(database, source, {
    at: new Date("2026-11-02T04:00:00.000Z"),
    instrumentsToTrack: [...instruments, { kind: "stock", code: "TLKM" }],
  });
  expect(requests).toEqual([{ code: "TLKM", from: historyStartDate }]);
});

test("takes every close before today as final on a date that no calendar covers", async () => {
  const database = openDatabaseForTest();
  const { source, requests } = recordingSource(
    sourceWithLaterCloses(["2028-01-03", "2028-01-04"]),
  );
  // 10:00 WIB on 4 January 2028, which no calendar covers.
  await updateHistory(database, source, {
    at: new Date("2028-01-04T03:00:00.000Z"),
  });
  expect(listDailyHistory(database, bbca).closes.at(-1)?.date).toBe(
    "2028-01-03",
  );
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

// Each state of the IDX schedule, with the moment of the latest update and a later moment in UTC, and whether the later moment asks for the closes again. The comment of each state gives the moments in WIB.
const scheduleStates: {
  name: string;
  updatedAt: string;
  laterAt: string;
  asksAgain: boolean;
}[] = [
  {
    // 10:00 and 14:00 WIB on Monday 2 November.
    name: "during the session after an update after the previous close",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T07:00:00.000Z",
    asksAgain: false,
  },
  {
    // 10:00 and 16:25 WIB on Monday 2 November.
    name: "in the last minute of the price hours",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T09:25:00.000Z",
    asksAgain: false,
  },
  {
    // 10:00 and 16:26 WIB on Monday 2 November.
    name: "in the first minute after the price hours",
    updatedAt: "2026-11-02T03:00:00.000Z",
    laterAt: "2026-11-02T09:26:00.000Z",
    asksAgain: true,
  },
  {
    // 16:26 WIB on Friday 30 October, and 10:00 WIB on Sunday 1 November.
    name: "on the weekend after an update after the Friday close",
    updatedAt: "2026-10-30T09:26:00.000Z",
    laterAt: "2026-11-01T03:00:00.000Z",
    asksAgain: false,
  },
  {
    // 16:26 WIB on 23 December, and 16:30 WIB on 24 December, a holiday.
    name: "on a holiday after an update after the close of the day before",
    updatedAt: "2026-12-23T09:26:00.000Z",
    laterAt: "2026-12-24T09:30:00.000Z",
    asksAgain: false,
  },
  {
    // 16:26 WIB on 23 December, and 16:26 WIB on Monday 28 December.
    name: "after the close of the first trading day after the holidays",
    updatedAt: "2026-12-23T09:26:00.000Z",
    laterAt: "2026-12-28T09:26:00.000Z",
    asksAgain: true,
  },
];

const sourceForSchedule = sourceWithLaterCloses([
  "2026-11-02",
  "2026-12-23",
  "2026-12-28",
]);

for (const state of scheduleStates) {
  test(`${state.asksAgain ? "asks again" : "asks nothing"} ${state.name}`, async () => {
    const database = openDatabaseForTest();
    await updateHistory(database, sourceForSchedule, {
      at: new Date(state.updatedAt),
    });
    const { source, requests } = recordingSource(sourceForSchedule);
    await updateHistory(database, source, { at: new Date(state.laterAt) });
    expect(requests).toHaveLength(state.asksAgain ? instruments.length : 0);
  });
}

test("asks for the closes of a day that became final while a long run was running", async () => {
  const database = openDatabaseForTest();
  const source = sourceWithLaterCloses(["2026-11-02"]);
  // The run starts at 16:25:30 WIB, before the closes of Monday are final, and ends at 16:27 WIB, after they are.
  await updateHistory(database, source, {
    at: [
      new Date("2026-11-02T09:25:30.000Z"),
      new Date("2026-11-02T09:27:00.000Z"),
    ],
  });
  expect(readLatestUpdateAttempt(database, "history")?.finalDate).toBe(
    "2026-10-30",
  );
  const { source: recording, requests } = recordingSource(source);
  await updateHistory(database, recording, {
    at: new Date("2026-11-02T09:28:00.000Z"),
  });
  expect(requests).toHaveLength(instruments.length);
  expect(listDailyHistory(database, bbca).closes.at(-1)?.date).toBe(
    "2026-11-02",
  );
});

const unanswered: PriceSource = {
  ...fixturePriceSource,
  fetchDailyHistory: () =>
    Promise.resolve(fail("Yahoo Finance did not answer.")),
};

// The warning names the instruments that the run skipped, so its sentence has one form for one instrument and another for several.
const skippedWarnings: { tracked: readonly Instrument[]; warning: string }[] = [
  {
    tracked: [...instruments, { kind: "stock", code: "TLKM" }],
    warning:
      "The closes of 3 instruments in a row could not be updated, so the history update skipped TLKM. It tries again once the wait after failures has passed.",
  },
  {
    tracked: [
      ...instruments,
      { kind: "stock", code: "TLKM" },
      { kind: "stock", code: "ASII" },
    ],
    warning:
      "The closes of 3 instruments in a row could not be updated, so the history update skipped TLKM and ASII. It tries again once the wait after failures has passed.",
  },
];

for (const { tracked, warning } of skippedWarnings) {
  test(`warns which instruments it skipped, for ${String(tracked.length - 3)} skipped`, async () => {
    await updateHistory(openDatabaseForTest(), unanswered, {
      at: mondayMorning,
      instrumentsToTrack: tracked,
    });
    expect(writeLog).toHaveBeenCalledWith("warning", warning);
  });
}

test("logs why it could not update an instrument, for a failure, an answer without closes, and a stale answer", async () => {
  const closesThroughFriday = await fixturePriceSource.fetchDailyHistory(
    { kind: "stock", code: "BBRI" },
    historyStartDate,
    new AbortController().signal,
  );
  const answers: Record<
    string,
    () => ReturnType<PriceSource["fetchDailyHistory"]>
  > = {
    IHSG: () => Promise.resolve(fail("Yahoo Finance did not answer.")),
    BBCA: () => Promise.resolve(succeed(buildDailyHistory(bbca, []))),
    BBRI: () => Promise.resolve(closesThroughFriday),
  };
  const source: PriceSource = {
    ...fixturePriceSource,
    fetchDailyHistory: (instrument) =>
      answers[instrument.code]?.() ??
      Promise.resolve(fail(`The test has no answer for ${instrument.code}.`)),
  };
  await updateHistory(openDatabaseForTest(), source, {
    at: mondayClose,
    instrumentsToTrack: [
      { kind: "index", code: "IHSG" },
      bbca,
      { kind: "stock", code: "BBRI" },
    ],
  });
  expect(vi.mocked(writeLog).mock.calls).toEqual([
    [
      "warning",
      "The closes of IHSG could not be updated, so its stored closes stay.",
      { detail: "Yahoo Finance did not answer." },
    ],
    [
      "warning",
      "The closes of BBCA could not be updated, so its stored closes stay.",
      {
        detail:
          "Yahoo Finance must return the closes of BBCA up to 2026-11-02, but its latest close is missing.",
      },
    ],
    [
      "warning",
      "The closes of BBRI could not be updated, so its stored closes stay.",
      {
        detail:
          "Yahoo Finance must return the closes of BBRI up to 2026-11-02, but its latest close is on 2026-10-30.",
      },
    ],
  ]);
});

test("logs a thrown error as an error with its stack", async () => {
  await updateHistory(
    openDatabaseForTest(),
    {
      ...fixturePriceSource,
      fetchDailyHistory: () =>
        Promise.reject(new Error("The network is down.")),
    },
    { at: mondayMorning, instrumentsToTrack: [bbca] },
  );
  expect(writeLog).toHaveBeenCalledWith(
    "error",
    "Fetching or storing the closes of BBCA failed.",
    {
      detail: expect.stringMatching(
        /^Error: The network is down\.\n\s+at /,
      ) as string,
    },
  );
});
