import { addDays } from "~/calendar-dates";
import { errorDetail } from "~/error-message";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { startOfWibDate, wibDateOf } from "~/wib";
import { writeLog } from "~/write-log.server";
import {
  listCodesWithHistory,
  readLatestClose,
  replaceDailyHistory,
  saveDailyHistory,
} from "./history-store.server";
import { latestClosedTradingDay } from "./idx-calendar";
import type { ClosedTradingDay } from "./idx-calendar";
import type { PriceJobSettings } from "./price-job-settings";
import type { DailyHistory, Instrument } from "./price-source.server";
import {
  readLatestUpdateAttempt,
  saveUpdateAttempt,
} from "./quote-store.server";
import type { UpdateAttempt } from "./quote-store.server";
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

/** What one run of the history update works with. */
interface HistoryRun {
  settings: PriceJobSettings;
  pacing: RequestPacing;
  /** The latest trading day whose closes are final, which ends every history that the run stores. */
  closedDay: ClosedTradingDay;
}

/**
 * Brings the stored daily closes of the instruments up to date. After a trading day closes, it fetches the closes of every instrument since its latest stored close. Between closes, it fetches again only the instruments that failed and the instruments without any stored close, once the wait after failures has passed. It stops after a few failures in a row and counts the instruments that it skipped as failed. It records the attempt with the instruments that it could not update. The state lives in the database, as decision 0009 asks, so a restart keeps waiting.
 */
export async function runHistoryUpdate(
  settings: PriceJobSettings,
  now: Date,
  pacing: RequestPacing,
): Promise<void> {
  const run: HistoryRun = {
    settings,
    pacing,
    closedDay: latestFinalClose(now, settings.priceSource.delayMinutes),
  };
  const latestAttempt = readLatestUpdateAttempt(settings.database, "history");
  const due = dueInstruments(run, latestAttempt, now);
  if (due.length === 0) {
    return;
  }
  const failedCodes: string[] = [];
  let failuresInARow = 0;
  for (const [index, instrument] of due.entries()) {
    if (failuresInARow === failuresBeforeStopping) {
      failedCodes.push(instrument.code);
      continue;
    }
    if (index > 0) {
      await pacing.waitBetweenRequests();
    }
    const update = await updateInstrumentHistory(run, instrument);
    failuresInARow = update.ok ? 0 : failuresInARow + 1;
    if (!update.ok) {
      writeLog(
        "warning",
        `The closes of ${instrument.code} could not be updated, so its stored closes stay.`,
        { detail: update.failure },
      );
      failedCodes.push(instrument.code);
    }
  }
  if (failuresInARow === failuresBeforeStopping) {
    writeLog(
      "warning",
      `The closes of ${String(failuresBeforeStopping)} instruments in a row could not be updated, so the history update asked for no more of them and waits before it tries again.`,
    );
  }
  saveUpdateAttempt(settings.database, "history", {
    attemptedAt: now,
    succeeded: failedCodes.length < due.length,
    // Each instrument costs a request, so the job waits after any instrument fails, instead of asking for it again every minute.
    consecutiveFailures:
      failedCodes.length === 0
        ? 0
        : (latestAttempt?.consecutiveFailures ?? 0) + 1,
    failedCodes,
  });
}

// On a date that no IDX calendar covers, every close before today counts as final, so the job still updates once a day. The price job already logs the missing calendar.
function latestFinalClose(now: Date, delayMinutes: number): ClosedTradingDay {
  const closedDay = latestClosedTradingDay(now, delayMinutes);
  if (closedDay.ok) {
    return closedDay.value;
  }
  const today = wibDateOf(now);
  return { date: addDays(today, -1), closedAt: startOfWibDate(today) };
}

function dueInstruments(
  { settings, closedDay }: HistoryRun,
  latestAttempt: UpdateAttempt | undefined,
  now: Date,
): readonly Instrument[] {
  if (latestAttempt === undefined) {
    return settings.instruments;
  }
  if (now < nextAttemptTime(latestAttempt)) {
    return [];
  }
  if (latestAttempt.attemptedAt < closedDay.closedAt) {
    return settings.instruments;
  }
  const storedCodes = listCodesWithHistory(settings.database);
  return settings.instruments.filter(
    (instrument) =>
      latestAttempt.failedCodes.includes(instrument.code) ||
      !storedCodes.has(instrument.code),
  );
}

// Fetching from the latest stored close, instead of the day after it, shows whether the source changed that close. A source adjusts every earlier close after a split, so a changed close means that the whole history must be fetched again.
async function updateInstrumentHistory(
  run: HistoryRun,
  instrument: Instrument,
): Promise<Result<undefined, string>> {
  const { settings } = run;
  try {
    const latestClose = readLatestClose(settings.database, instrument);
    const history = await fetchFinalCloses(
      run,
      instrument,
      latestClose?.date ?? settings.historyStartDate,
    );
    if (!history.ok) {
      return history;
    }
    const sameDay = history.value.closes.find(
      (close) => close.date === latestClose?.date,
    );
    if (latestClose === undefined || sameDay?.close === latestClose.close) {
      saveDailyHistory(settings.database, history.value);
      return succeed(undefined);
    }
    writeLog(
      "info",
      `${settings.priceSource.name} changed the close of ${instrument.code} on ${latestClose.date}, so Portolab fetches its whole history again.`,
      { storedClose: latestClose.close, newClose: sameDay?.close },
    );
    await run.pacing.waitBetweenRequests();
    const wholeHistory = await fetchFinalCloses(
      run,
      instrument,
      settings.historyStartDate,
    );
    if (!wholeHistory.ok) {
      return wholeHistory;
    }
    replaceDailyHistory(settings.database, wholeHistory.value);
    return succeed(undefined);
  } catch (error) {
    return fail(
      `Fetching or storing the closes of ${instrument.code} failed: ${errorDetail(error)}`,
    );
  }
}

// A close of a day whose prices can still change is left out, because only a final close belongs in the history. Every answer includes the latest stored close, so an answer without a final close is a failure, and it never replaces the stored closes.
async function fetchFinalCloses(
  { settings, pacing, closedDay }: HistoryRun,
  instrument: Instrument,
  from: string,
): Promise<Result<DailyHistory, string>> {
  const history = await settings.priceSource.fetchDailyHistory(
    instrument,
    from,
    pacing.requestSignal(),
  );
  if (!history.ok) {
    return history;
  }
  const finalHistory = finalClosesOf(history.value, closedDay.date);
  if (finalHistory.closes.length === 0) {
    return fail(
      `${settings.priceSource.name} returned no final close of ${instrument.code} from ${from} to ${closedDay.date}.`,
    );
  }
  return succeed(finalHistory);
}

function finalClosesOf(
  history: DailyHistory,
  closedDate: string,
): DailyHistory {
  const isFinal = (close: { date: string }): boolean =>
    close.date <= closedDate;
  switch (history.kind) {
    case "stock":
      return { ...history, closes: history.closes.filter(isFinal) };
    case "index":
      return { ...history, closes: history.closes.filter(isFinal) };
  }
}
