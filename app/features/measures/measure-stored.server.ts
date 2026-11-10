import type { Database } from "~/database/database.server";
import { listDailyHistory } from "~/features/market-data/history-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { alignedReturns } from "./aligned-returns";
import type { InstrumentCloses } from "./aligned-returns";
import { measureMarket } from "./capm";
import type { MarketMeasures, StockMeasures } from "./capm";
import { defaultEstimationSettings } from "./estimation-settings";
import { forecastEnoughReturns } from "./forecast-enough-returns";
import type { MeasureFailure } from "./measure";
import { measurePortfolio } from "./measure-portfolio";
import type { PortfolioMeasures } from "./measure-portfolio";
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

/** The measures of a portfolio, with the share of its value that its cash has. */
export type StoredPortfolioMeasures = PortfolioMeasures & {
  cashWeight: PortfolioWeight;
};

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

/** Measures a portfolio against the IHSG from the daily closes that the price job stored, with the settings that every measure uses. Each holding names a stock and its value at the latest prices, and the cash is the rest of the value of the portfolio. The weight of a holding or of the cash is its share of that whole value. */
export function measureStoredPortfolio(
  database: Database,
  portfolio: {
    holdings: readonly { code: string; value: Rupiah }[];
    cash: Rupiah;
  },
): Result<StoredPortfolioMeasures, StoredMeasureFailure> {
  let wholeValue = portfolio.cash;
  for (const holding of portfolio.holdings) {
    wholeValue = rupiah(wholeValue + holding.value);
  }
  const holdings = portfolio.holdings.map((holding) => ({
    ...listDailyHistory(database, { kind: "stock", code: holding.code }),
    weight: portfolioWeight(holding.value / wholeValue),
  }));
  const market = listDailyHistory(database, marketIndex);
  const measures = measurePortfolio(
    holdings,
    market,
    defaultEstimationSettings,
  );
  if (!measures.ok) {
    return fail(withForecast(measures.failure, holdings, market));
  }
  return succeed({
    ...measures.value,
    cashWeight: portfolioWeight(portfolio.cash / wholeValue),
  });
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
