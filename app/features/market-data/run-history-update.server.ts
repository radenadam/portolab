import { addDays } from "~/calendar-dates";
import { errorDetail } from "~/error-message";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { listOfWords } from "~/sentences";
import { wibDateOf } from "~/wib";
import { writeLog } from "~/write-log.server";
import { listCodesWithHistory, saveDailyHistory } from "./history-store.server";
import { latestClosedTradingDay } from "./idx-calendar";
import type { PriceJobSettings } from "./price-job-settings";
import type { DailyHistory, Instrument } from "./price-source.server";
import {
  readLatestUpdateAttempt,
  saveUpdateAttempt,
} from "./update-attempts.server";
import type { UpdateAttempt } from "./update-attempts.server";
import { nextAttemptTime } from "./update-schedule";

// When this many instruments in a row fail, the source is most likely down, so the run stops instead of adding requests while it recovers, as decision 0001 asks.
const failuresBeforeStopping = 3;

/** How the history job paces its requests to the price source, one instrument at a time. */
export interface RequestPacing {
  /** Gives the signal for one request, which aborts when the job stops waiting for it. */
  requestSignal: () => AbortSignal;
  /** Waits before the next request. */
  waitBetweenRequests: () => Promise<void>;
}

/** The latest day whose closes are final. */
interface FinalDay {
  date: string;
  /** Whether an IDX calendar shows the day as a trading day, so that every instrument must have a close on it. */
  isTradingDay: boolean;
}

/** What one run of the history update works with. */
interface HistoryRun {
  settings: PriceJobSettings;
  pacing: RequestPacing;
  finalDay: FinalDay;
}

/**
 * Brings the stored daily closes of the instruments up to date. After a trading day closes, it fetches the whole history of every instrument from the start date, because a source adjusts every earlier close after a split, sometimes days later. Between closes, it fetches again only the instruments that failed and the instruments without any stored close, once the wait after failures has passed. It stops after a few failures in a row, counts the instruments that it skipped as failed, and asks for them first in the next retry. It records the attempt when its last request has ended, with the instruments that it could not update and the latest final day that it asked for, so a later close that became final during a long run is still fetched. The state lives in the database, as decision 0009 asks, so a restart keeps waiting.
 */
export async function runHistoryUpdate(
  settings: PriceJobSettings,
  clock: () => Date,
  pacing: RequestPacing,
): Promise<void> {
  const startedAt = clock();
  const run: HistoryRun = {
    settings,
    pacing,
    finalDay: latestFinalDay(startedAt, settings.priceSource.delayMinutes),
  };
  const latestAttempt = readLatestUpdateAttempt(settings.database, "history");
  const due = dueInstruments(run, latestAttempt, startedAt);
  if (due.length === 0) {
    return;
  }
  const failedCodes: string[] = [];
  const skippedCodes: string[] = [];
  let failuresInARow = 0;
  for (const [index, instrument] of due.entries()) {
    if (failuresInARow === failuresBeforeStopping) {
      skippedCodes.push(instrument.code);
      continue;
    }
    if (index > 0) {
      await pacing.waitBetweenRequests();
    }
    const isUpdated = await updateInstrumentHistory(run, instrument);
    failuresInARow = isUpdated ? 0 : failuresInARow + 1;
    if (!isUpdated) {
      failedCodes.push(instrument.code);
    }
  }
  if (skippedCodes.length > 0) {
    writeLog(
      "warning",
      `The closes of ${String(failuresBeforeStopping)} instruments in a row could not be updated, so the history update skipped ${listOfWords(skippedCodes)}. It tries again once the wait after failures has passed.`,
    );
  }
  const notUpdatedCodes = [...skippedCodes, ...failedCodes];
  saveUpdateAttempt(settings.database, "history", {
    attemptedAt: clock(),
    succeeded: notUpdatedCodes.length < due.length,
    // Each instrument costs a request, so the job waits after any instrument fails, instead of asking for it again every minute.
    consecutiveFailures:
      notUpdatedCodes.length === 0
        ? 0
        : (latestAttempt?.consecutiveFailures ?? 0) + 1,
    failedCodes: notUpdatedCodes,
    finalDate: run.finalDay.date,
  });
}

// When the search for the latest closed trading day reaches a date that no IDX calendar covers, every close before today counts as final, so the job still updates once a day. That day may be a weekend or a holiday, so no instrument must have a close on it.
function latestFinalDay(moment: Date, delayMinutes: number): FinalDay {
  const closedDay = latestClosedTradingDay(moment, delayMinutes);
  if (closedDay.ok) {
    return { date: closedDay.value, isTradingDay: true };
  }
  return { date: addDays(wibDateOf(moment), -1), isTradingDay: false };
}

function dueInstruments(
  { settings, finalDay }: HistoryRun,
  latestAttempt: UpdateAttempt | undefined,
  now: Date,
): readonly Instrument[] {
  if (latestAttempt === undefined) {
    return settings.instruments;
  }
  if (now < nextAttemptTime(latestAttempt)) {
    return [];
  }
  if (latestAttempt.finalDate !== finalDay.date) {
    return settings.instruments;
  }
  // The failed instruments come in the order of the attempt, which puts the ones that it skipped first, so instruments that keep failing at the front cannot hold back the others on every retry. Instruments without stored closes, such as a stock that a new period of the universe added, come after them.
  const due: Instrument[] = [];
  for (const code of latestAttempt.failedCodes) {
    const instrument = settings.instruments.find(
      (tracked) => tracked.code === code,
    );
    if (instrument !== undefined) {
      due.push(instrument);
    }
  }
  const storedCodes = listCodesWithHistory(settings.database);
  for (const instrument of settings.instruments) {
    if (!storedCodes.has(instrument.code) && !due.includes(instrument)) {
      due.push(instrument);
    }
  }
  return due;
}

// Returns whether the closes were stored, and logs why they were not. An expected failure is a warning, and a thrown error is an error with its stack, because it should never happen.
async function updateInstrumentHistory(
  run: HistoryRun,
  instrument: Instrument,
): Promise<boolean> {
  try {
    const history = await fetchFinalCloses(run, instrument);
    if (!history.ok) {
      writeLog(
        "warning",
        `The closes of ${instrument.code} could not be updated, so its stored closes stay.`,
        { detail: history.failure },
      );
      return false;
    }
    saveDailyHistory(run.settings.database, history.value);
    return true;
  } catch (error) {
    writeLog(
      "error",
      `Fetching or storing the closes of ${instrument.code} failed.`,
      { detail: errorDetail(error) },
    );
    return false;
  }
}

// A close of a day whose prices can still change is left out, because only a final close belongs in the history. An answer that lacks the close of the latest trading day is stale, so it is a failure, which the job asks again for after the wait.
async function fetchFinalCloses(
  { settings, pacing, finalDay }: HistoryRun,
  instrument: Instrument,
): Promise<Result<DailyHistory, string>> {
  const history = await settings.priceSource.fetchDailyHistory(
    instrument,
    settings.historyStartDate,
    pacing.requestSignal(),
  );
  if (!history.ok) {
    return history;
  }
  const finalHistory = finalClosesOf(history.value, finalDay.date);
  const latestDate = finalHistory.closes.at(-1)?.date;
  if (
    latestDate === undefined ||
    (finalDay.isTradingDay && latestDate !== finalDay.date)
  ) {
    return fail(
      `${settings.priceSource.name} must return the closes of ${instrument.code} up to ${finalDay.date}, but its latest close is ${latestDate === undefined ? "missing" : `on ${latestDate}`}.`,
    );
  }
  return succeed(finalHistory);
}

function finalClosesOf(history: DailyHistory, finalDate: string): DailyHistory {
  const isFinal = (close: { date: string }): boolean => close.date <= finalDate;
  switch (history.kind) {
    case "stock":
      return { ...history, closes: history.closes.filter(isFinal) };
    case "index":
      return { ...history, closes: history.closes.filter(isFinal) };
  }
}
