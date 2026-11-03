import { addDays, startOfMonth } from "~/calendar-dates";
import type {
  IndexHistory,
  StockHistory,
} from "~/features/market-data/price-source.server";
import { universeOn } from "~/features/market-data/tracked-instruments";
import { countReturns } from "~/features/measures/aligned-returns";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import type { EstimationSettings } from "~/features/measures/estimation-settings";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { OrderFailure } from "./order";

/** The stored final daily closes of the stock of an order and of the market. They give the monthly returns that the measures can use, and with a quote the reference price of the auto rejection limits. */
export interface StockHistories {
  closes: StockHistory;
  marketCloses: IndexHistory;
}

/** Checks that a stock can be bought on a trading day by the rules of decision 0015: it is in the universe of that day, and it has the monthly returns that the measures need. */
export function checkBuyable(
  code: string,
  date: string,
  stock: StockHistories,
): Result<undefined, OrderFailure> {
  const universe = universeOn(date);
  if (!universe.ok) {
    return fail({ kind: "missingUniverse", reason: universe.failure });
  }
  if (!universe.value.includes(code)) {
    return fail({ kind: "outsideUniverse", code, date });
  }
  const settings = defaultEstimationSettings;
  const returns = countReturns(stock.closes, stock.marketCloses, settings);
  if (returns.windowEnd === undefined) {
    return fail({
      kind: "noPriceHistory",
      code,
      instrument: stock.marketCloses.code,
    });
  }
  if (stock.closes.closes.length === 0) {
    return fail({ kind: "noPriceHistory", code, instrument: code });
  }
  if (returns.count < returns.minimum) {
    return fail({
      kind: "tooFewReturns",
      code,
      count: returns.count,
      minimum: returns.minimum,
      enoughAfterFirstTradingDayOf: monthWithEnoughReturns(
        stock,
        returns.windowEnd,
        settings,
      ),
    });
  }
  return succeed(undefined);
}

/** The first day of the month whose first trading day completes the month that gives a stock the returns that the measures need, if the stock and the market keep a close at the end of every month after the window end. It counts with countReturns on the closes that each later month adds, because a month that enters the window pushes out its oldest month, which can hold a return. */
function monthWithEnoughReturns(
  stock: StockHistories,
  windowEnd: string,
  settings: EstimationSettings,
): string {
  const latestClose = stock.closes.closes.at(-1);
  const latestLevel = stock.marketCloses.closes.at(-1);
  if (latestClose === undefined || latestLevel === undefined) {
    throw new Error(
      `checkBuyable counted returns of ${stock.closes.code} only after it found the closes of the stock and of the market, but one of them is empty.`,
    );
  }
  const closes = [...stock.closes.closes];
  const levels = [...stock.marketCloses.closes];
  // After a whole window of later months, the window holds only months in which the stock keeps a close, so the count reaches the number of returns of the settings, which is at least the minimum.
  for (let months = 1; months <= settings.returnCount + 1; months += 1) {
    const nextMonth = startOfMonth(windowEnd, months + 1);
    const monthEnd = addDays(nextMonth, -1);
    closes.push({ date: monthEnd, close: latestClose.close });
    levels.push({ date: monthEnd, close: latestLevel.close });
    // The market completes a month once it has a close in the next month.
    const counted = countReturns(
      { ...stock.closes, closes },
      {
        ...stock.marketCloses,
        closes: [...levels, { date: nextMonth, close: latestLevel.close }],
      },
      settings,
    );
    if (counted.count >= counted.minimum) {
      return nextMonth;
    }
  }
  throw new Error(
    `The minimum of ${String(settings.minimumReturnCount)} returns must not exceed the ${String(settings.returnCount)} returns of the window, but no later month gives ${stock.closes.code} enough.`,
  );
}
