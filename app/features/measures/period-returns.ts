import { startOfMonth, startOfWeek } from "~/calendar-dates";
import { priceChange } from "~/features/market-data/price-change";
import type { DailyClose } from "~/features/market-data/price-source.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { IndexPoints } from "~/units/index-points";
import { periodReturn } from "~/units/period-return";
import type { PeriodReturn } from "~/units/period-return";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { EstimationSettings } from "./estimation-settings";
import type { ReturnFrequency } from "./return-frequency";
import type { Measure, MeasureFailure } from "./measure";

/** A close of a stock or of the market. */
export type ClosePrice = SplitAdjustedRupiah | IndexPoints;

/** The return of an instrument over one period, from its close on the last trading day of the previous period to its close on the last trading day of this period. */
export type ReturnMeasure = Measure<
  "priceChange",
  PeriodReturn,
  {
    startDate: string;
    startClose: ClosePrice;
    endDate: string;
    endClose: ClosePrice;
  }
>;

/** The daily closes of one instrument, oldest first, with the code that a failure names. */
export interface InstrumentCloses {
  code: string;
  closes: readonly DailyClose<ClosePrice>[];
}

// A period is named by the date on which it starts, so every date of one period has the same name.
const periodNames: Record<ReturnFrequency, (date: string) => string> = {
  weekly: startOfWeek,
  monthly: (date) => startOfMonth(date, 0),
};

/** The last trading day of each complete period of the closes of the market, oldest first. A period is complete once the market has a close in a later period, so the period of the latest close is left out. */
export function periodEndDates(
  marketCloses: readonly DailyClose<ClosePrice>[],
  frequency: ReturnFrequency,
): string[] {
  const periodName = periodNames[frequency];
  const endDates: string[] = [];
  for (const [index, close] of marketCloses.entries()) {
    const next = marketCloses[index + 1];
    if (
      next !== undefined &&
      periodName(next.date) !== periodName(close.date)
    ) {
      endDates.push(close.date);
    }
  }
  return endDates;
}

/** The returns of an instrument between each pair of consecutive dates, from its closes on exactly those dates. A date without a close of the instrument, such as one before its listing, gives no return for the periods on either side of it. */
export function returnsBetween(
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
        value: periodReturn(priceChange(endClose, startClose)),
        inputs: { startDate, startClose, endDate, endClose },
      });
    }
  }
  return returns;
}

/** The returns of the market and of instruments over the periods that they all share. */
export interface AlignedReturns<Instrument> {
  market: ReturnMeasure[];
  /** Each instrument with its returns, in the order of the instruments. */
  instruments: { instrument: Instrument; returns: ReturnMeasure[] }[];
  /** The end date of the latest period, which ends the window. */
  windowEnd: string;
}

/**
 * The returns of the market and of each instrument in the latest complete periods that the settings choose, kept only for the periods in which the market and every instrument have a return. So every measure of these instruments comes from one table of returns.
 * It fails when fewer periods remain than the settings require, and names the instrument with the fewest returns, or the market when no instrument has fewer.
 */
export function alignedReturns<Instrument extends InstrumentCloses>(
  market: InstrumentCloses,
  instruments: readonly Instrument[],
  settings: EstimationSettings,
): Result<AlignedReturns<Instrument>, MeasureFailure> {
  const window = periodEndDates(market.closes, settings.frequency).slice(
    -(settings.returnCount + 1),
  );
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
  return succeed({
    market: sharedMarketReturns,
    instruments: instrumentReturns.map(({ instrument, returns }) => ({
      instrument,
      returns: returns.filter(isShared),
    })),
    windowEnd,
  });
}

function endDatesOf(returns: readonly ReturnMeasure[]): Set<string> {
  return new Set(returns.map((measure) => measure.inputs.endDate));
}
