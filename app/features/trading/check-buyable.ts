import type {
  IndexHistory,
  StockHistory,
} from "~/features/market-data/price-source.server";
import { universeOn } from "~/features/market-data/tracked-instruments";
import { countReturns } from "~/features/measures/aligned-returns";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { forecastEnoughReturns } from "~/features/measures/forecast-enough-returns";
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
  const universe = purchaseUniverseOn(date);
  if (!universe.ok) {
    return universe;
  }
  if (!universe.value.includes(code)) {
    return fail({ kind: "outsideUniverse", code, date });
  }
  const settings = defaultEstimationSettings;
  const returns = countReturns([stock.closes], stock.marketCloses, settings);
  if (returns.count >= returns.minimum) {
    return succeed(undefined);
  }
  const enough = forecastEnoughReturns(
    [stock.closes],
    stock.marketCloses,
    settings,
  );
  if (!enough.ok) {
    return fail({
      kind: "noPriceHistory",
      code,
      instrument: enough.failure.code,
    });
  }
  return fail({
    kind: "tooFewReturns",
    code,
    count: returns.count,
    minimum: returns.minimum,
    enoughAfterFirstTradingDayOf: enough.value,
  });
}

/** The codes of the stocks in the universe of a trading day, which are the only stocks that a purchase of that day can buy. It fails when no recorded period of the LQ45 covers the day, so every purchase of that day fails. */
export function purchaseUniverseOn(
  date: string,
): Result<
  readonly string[],
  Extract<OrderFailure, { kind: "missingUniverse" }>
> {
  const universe = universeOn(date);
  if (!universe.ok) {
    return fail({ kind: "missingUniverse", reason: universe.failure });
  }
  return universe;
}
