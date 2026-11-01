import { startOfMonth } from "~/calendar-dates";
import { priceChange } from "~/features/market-data/price-change";
import type {
  ClosePrice,
  DailyClose,
} from "~/features/market-data/price-source.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { EstimationSettings } from "./estimation-settings";
import type { Measure, MeasureFailure } from "./measure";

/** The return of an instrument over one month, from its close on the last trading day of the previous month to its close on the last trading day of this month. */
export type ReturnMeasure = Measure<
  "priceChange",
  MonthlyReturn,
  {
    startDate: string;
    startClose: ClosePrice;
    endDate: string;
    endClose: ClosePrice;
  }
>;

/** The daily closes of one instrument, oldest first, with the code that a failure names. The stored history of an instrument has this shape. */
export interface InstrumentCloses {
  code: string;
  closes: readonly DailyClose<ClosePrice>[];
}

/** The last trading day of each complete month of the closes of the market, oldest first. A month is complete once the market has a close in a later month, so the month of the latest close is left out. */
function monthEndDates(
  marketCloses: readonly DailyClose<ClosePrice>[],
): string[] {
  const endDates: string[] = [];
  for (const [index, close] of marketCloses.entries()) {
    const next = marketCloses[index + 1];
    if (
      next !== undefined &&
      startOfMonth(next.date, 0) !== startOfMonth(close.date, 0)
    ) {
      endDates.push(close.date);
    }
  }
  return endDates;
}

/** The returns of an instrument between each pair of consecutive dates, from its closes on exactly those dates. A date without a close of the instrument, such as one before its listing, gives no return for the months on either side of it. */
function returnsBetween(
  closes: readonly DailyClose<ClosePrice>[],
  dates: readonly string[],
): ReturnMeasure[] {
  const closesByDate = new Map<string, ClosePrice>();
  for (const close of closes) {
    closesByDate.set(close.date, close.close);
  }
  const returns: ReturnMeasure[] = [];
  for (const [index, endDate] of dates.entries()) {
    const startDate = dates[index - 1];
    const startClose =
      startDate === undefined ? undefined : closesByDate.get(startDate);
    const endClose = closesByDate.get(endDate);
    if (
      startDate !== undefined &&
      startClose !== undefined &&
      endClose !== undefined
    ) {
      returns.push({
        formula: "priceChange",
        value: monthlyReturn(priceChange(endClose, startClose)),
        inputs: { startDate, startClose, endDate, endClose },
      });
    }
  }
  return returns;
}

/** The last trading days of the months whose returns the settings choose, oldest first, which includes the month before the first return. */
function windowEndDates(
  marketCloses: readonly DailyClose<ClosePrice>[],
  settings: EstimationSettings,
): string[] {
  return monthEndDates(marketCloses).slice(-(settings.returnCount + 1));
}

/** How many monthly returns an instrument has for the measures, against how many they need. */
export interface ReturnCount {
  code: string;
  /** The returns of the instrument in the window of the settings. The market has a return in every month of the window, so these are the months that the instrument shares with the market. */
  count: number;
  /** The fewest returns that the measures accept. */
  minimum: number;
  /** The end date of the latest month of the window, or undefined while the market has no complete month. */
  windowEnd: string | undefined;
}

/** Counts the monthly returns of an instrument in the window of the settings, which are the returns that alignedReturns gives for the instrument and the market alone. */
export function countReturns(
  instrument: InstrumentCloses,
  market: InstrumentCloses,
  settings: EstimationSettings,
): ReturnCount {
  const window = windowEndDates(market.closes, settings);
  return {
    code: instrument.code,
    count: returnsBetween(instrument.closes, window).length,
    minimum: settings.minimumReturnCount,
    windowEnd: window.at(-1),
  };
}

/** The returns of the market and of instruments over the months that they all share. */
export interface AlignedReturns<Instrument> {
  market: ReturnMeasure[];
  /** Each instrument with its returns, in the order of the instruments. */
  instruments: { instrument: Instrument; returns: ReturnMeasure[] }[];
  /** The end date of the latest month, which ends the window. */
  windowEnd: string;
}

/**
 * The returns of the market and of each instrument in the latest complete months that the settings choose, kept only for the months in which the market and every instrument have a return. So every measure of these instruments comes from one table of returns.
 * It fails when fewer months remain than the settings require, and names the instrument with the fewest returns, or the market when no instrument has fewer. It also fails for an instrument whose returns are the same in every month, such as a stock whose price never changed, and names it.
 */
export function alignedReturns<Instrument extends InstrumentCloses>(
  market: InstrumentCloses,
  instruments: readonly Instrument[],
  settings: EstimationSettings,
): Result<AlignedReturns<Instrument>, MeasureFailure> {
  const window = windowEndDates(market.closes, settings);
  const marketReturns = returnsBetween(market.closes, window);
  let sharedEndDates = endDatesOf(marketReturns);
  let shortest = { code: market.code, count: marketReturns.length };
  const instrumentReturns: AlignedReturns<Instrument>["instruments"] = [];
  for (const instrument of instruments) {
    const returns = returnsBetween(instrument.closes, window);
    instrumentReturns.push({ instrument, returns });
    const endDates = endDatesOf(returns);
    sharedEndDates = new Set(
      [...sharedEndDates].filter((endDate) => endDates.has(endDate)),
    );
    if (returns.length < shortest.count) {
      shortest = { code: instrument.code, count: returns.length };
    }
  }
  if (sharedEndDates.size < settings.minimumReturnCount) {
    return fail({
      kind: "tooFewReturns",
      code: shortest.code,
      count: sharedEndDates.size,
      minimum: settings.minimumReturnCount,
    });
  }
  const isShared = (measure: ReturnMeasure): boolean =>
    sharedEndDates.has(measure.inputs.endDate);
  const sharedMarketReturns = marketReturns.filter(isShared);
  const windowEnd = sharedMarketReturns.at(-1)?.inputs.endDate;
  if (windowEnd === undefined) {
    throw new Error(
      `The settings must require at least one return, but they require ${String(settings.minimumReturnCount)}.`,
    );
  }
  const sharedInstrumentReturns = instrumentReturns.map(
    ({ instrument, returns }) => ({
      instrument,
      returns: returns.filter(isShared),
    }),
  );
  const unvaried = [
    { code: market.code, returns: sharedMarketReturns },
    ...sharedInstrumentReturns.map(({ instrument, returns }) => ({
      code: instrument.code,
      returns,
    })),
  ].find(({ returns }) => !hasVariation(returns));
  if (unvaried !== undefined) {
    return fail({ kind: "noVariation", code: unvaried.code });
  }
  return succeed({
    market: sharedMarketReturns,
    instruments: sharedInstrumentReturns,
    windowEnd,
  });
}

// Returns that are all the same have a variance of zero, and a correlation and a beta divide by that variance.
function hasVariation(returns: readonly ReturnMeasure[]): boolean {
  const firstValue = returns[0]?.value;
  return returns.some((measure) => measure.value !== firstValue);
}

function endDatesOf(returns: readonly ReturnMeasure[]): Set<string> {
  return new Set(returns.map((measure) => measure.inputs.endDate));
}
