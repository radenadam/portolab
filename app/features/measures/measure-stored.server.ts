import type { Database } from "~/database/database.server";
import { listDailyHistory } from "~/features/market-data/history-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { fail } from "~/result";
import type { Result } from "~/result";
import type { Rupiah } from "~/units/rupiah";
import { alignedReturns } from "./aligned-returns";
import type { InstrumentCloses } from "./aligned-returns";
import { measureMarket } from "./capm";
import type { MarketMeasures, StockMeasures } from "./capm";
import { defaultEstimationSettings } from "./estimation-settings";
import { forecastEnoughReturns } from "./forecast-enough-returns";
import type { MeasureFailure } from "./measure";
import { measureValuedPortfolio } from "./measure-valued-portfolio";
import type { ValuedPortfolioMeasures } from "./measure-valued-portfolio";
import { measureStock } from "./measure-stock";

type TooFewReturns = Extract<MeasureFailure, { kind: "tooFewReturns" }>;

/** Why the stored closes give no measures. A failure for too few returns also holds the first day of the month whose first trading day brings enough, if the IHSG and every stock keep a close at the end of every month, or the instrument without the closes from which Portolab can tell. */
export type StoredMeasureFailure =
  | Exclude<MeasureFailure, TooFewReturns>
  | (TooFewReturns & {
      enoughAfterFirstTradingDayOf: Result<string, { code: string }>;
    });

/** The measures of a stock against the IHSG, or why the stored closes give none. */
export interface StoredStockMeasures {
  code: string;
  measures: Result<
    { stock: StockMeasures; market: MarketMeasures },
    StoredMeasureFailure
  >;
}

/** Measures each stock against the IHSG from the daily closes that the price job stored, with the settings that every measure uses, in the order of the codes. */
export function measureStoredStocks(
  database: Database,
  codes: readonly string[],
): StoredStockMeasures[] {
  const market = listDailyHistory(database, marketIndex);
  return codes.map((code) => {
    const stock = listDailyHistory(database, { kind: "stock", code });
    const measures = measureStock(stock, market, defaultEstimationSettings);
    return {
      code,
      measures: measures.ok
        ? measures
        : fail(withForecast(measures.failure, [stock], market)),
    };
  });
}

/** Measures a portfolio against the IHSG from the daily closes that the price job stored, with the settings that every measure uses. Each holding names a stock and its value at the latest prices, and the cash is the rest of the value of the portfolio, as measureValuedPortfolio weighs them. */
export function measureStoredPortfolio(
  database: Database,
  portfolio: {
    holdings: readonly { code: string; value: Rupiah }[];
    cash: Rupiah;
  },
): Result<ValuedPortfolioMeasures, StoredMeasureFailure> {
  const holdings = portfolio.holdings.map((holding) => ({
    ...listDailyHistory(database, { kind: "stock", code: holding.code }),
    value: holding.value,
  }));
  const market = listDailyHistory(database, marketIndex);
  const measures = measureValuedPortfolio(
    { holdings, cash: portfolio.cash },
    market,
    defaultEstimationSettings,
  );
  return measures.ok
    ? measures
    : fail(withForecast(measures.failure, holdings, market));
}

/** Measures the IHSG alone from the daily closes that the price job stored, over the latest complete months of the settings that every measure uses, with the risk-free rate. They give the security market line of every stock whose measures use all of those months. */
export function measureStoredMarket(
  database: Database,
): Result<MarketMeasures, StoredMeasureFailure> {
  const market = listDailyHistory(database, marketIndex);
  const returns = alignedReturns(market, [], defaultEstimationSettings);
  const measures = returns.ok ? measureMarket(returns.value) : returns;
  return measures.ok
    ? measures
    : fail(withForecast(measures.failure, [], market));
}

function withForecast(
  failure: MeasureFailure,
  instruments: readonly InstrumentCloses[],
  market: InstrumentCloses,
): StoredMeasureFailure {
  switch (failure.kind) {
    case "tooFewReturns":
      return {
        ...failure,
        enoughAfterFirstTradingDayOf: forecastEnoughReturns(
          instruments,
          market,
          defaultEstimationSettings,
        ),
      };
    case "noVariation":
    case "noRiskFreeRate":
      return failure;
  }
}
