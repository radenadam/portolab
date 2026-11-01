import type { Database } from "~/database/database.server";
import { listDailyHistory } from "~/features/market-data/history-store.server";
import type { Instrument } from "~/features/market-data/price-source.server";
import type { Result } from "~/result";
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

/** Measures a portfolio against the IHSG from the daily closes that the price job stored, with the settings that every measure uses. Each holding names a stock and its share of the value of the portfolio, and the rest of the value is cash. */
export function measureStoredPortfolio(
  database: Database,
  holdings: readonly { code: string; weight: number }[],
): Result<PortfolioMeasures, MeasureFailure> {
  return measurePortfolio(
    holdings.map((holding) => ({
      ...listDailyHistory(database, { kind: "stock", code: holding.code }),
      weight: holding.weight,
    })),
    listDailyHistory(database, market),
    defaultEstimationSettings,
  );
}
