import type { Database } from "~/database/database.server";
import { listDailyHistory } from "~/features/market-data/history-store.server";
import type { Instrument } from "~/features/market-data/price-source.server";
import type { Result } from "~/result";
import { portfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { MarketMeasures, StockMeasures } from "./capm";
import { defaultEstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { measurePortfolio } from "./measure-portfolio";
import type { PortfolioMeasures } from "./measure-portfolio";
import { measureStock } from "./measure-stock";

const market: Instrument = { kind: "index", code: "IHSG" };

/** Measures a stock against the IHSG from the daily closes that the price job stored, with the settings that every measure uses. */
export function measureStoredStock(
  database: Database,
  code: string,
): Result<{ stock: StockMeasures; market: MarketMeasures }, MeasureFailure> {
  return measureStock(
    listDailyHistory(database, { kind: "stock", code }),
    listDailyHistory(database, market),
    defaultEstimationSettings,
  );
}

/** Measures a portfolio against the IHSG from the daily closes that the price job stored, with the settings that every measure uses. Each holding names a stock and its value at the latest prices, and the cash is the rest of the value of the portfolio. The weight of a holding is its share of that whole value. */
export function measureStoredPortfolio(
  database: Database,
  portfolio: {
    holdings: readonly { code: string; value: Rupiah }[];
    cash: Rupiah;
  },
): Result<PortfolioMeasures, MeasureFailure> {
  let wholeValue = portfolio.cash;
  for (const holding of portfolio.holdings) {
    wholeValue = rupiah(wholeValue + holding.value);
  }
  return measurePortfolio(
    portfolio.holdings.map((holding) => ({
      ...listDailyHistory(database, { kind: "stock", code: holding.code }),
      weight: portfolioWeight(holding.value / wholeValue),
    })),
    listDailyHistory(database, market),
    defaultEstimationSettings,
  );
}
