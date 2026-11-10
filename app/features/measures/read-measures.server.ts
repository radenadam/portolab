import type { Database } from "~/database/database.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Rupiah } from "~/units/rupiah";
import {
  summarizePortfolio,
  summarizeStock,
  summarizeStockRow,
} from "./measure-summaries";
import type {
  PortfolioSummary,
  StockRowSummary,
  StockSummary,
} from "./measure-summaries";
import {
  measureStoredPortfolio,
  measureStoredStocks,
} from "./measure-stored.server";
import type { StoredMeasureFailure } from "./measure-stored.server";

/** The measures of a portfolio as its page shows them, or why it has none: it holds no stock, a stock has no delayed price to weigh it with, or the stored closes give no measures. */
export type PortfolioMeasuresReport =
  | { kind: "noHoldings" }
  | { kind: "unpriced"; codes: string[] }
  | {
      kind: "measured";
      measures: Result<PortfolioSummary, StoredMeasureFailure>;
    };

/** A stock of the table of every stock, with the measures that the table shows or why it has none. */
export interface StockRow {
  code: string;
  measures: Result<StockRowSummary, StoredMeasureFailure>;
}

/** Measures a portfolio of any student of a class, valued at the latest delayed prices of its holdings, from the stored closes. */
export function readPortfolioMeasures(
  database: Database,
  valuation: PortfolioValuation,
): PortfolioMeasuresReport {
  if (valuation.holdings.length === 0) {
    return { kind: "noHoldings" };
  }
  if (valuation.total === undefined) {
    return { kind: "unpriced", codes: valuation.unpricedCodes };
  }
  const holdings: { code: string; value: Rupiah }[] = [];
  for (const holding of valuation.holdings) {
    if (holding.kind === "priced") {
      holdings.push({ code: holding.code, value: holding.value });
    }
  }
  const values = { holdings, cash: valuation.cash };
  const measures = measureStoredPortfolio(database, values);
  return {
    kind: "measured",
    measures: measures.ok
      ? succeed(
          summarizePortfolio(measures.value, {
            ...values,
            total: valuation.total.value,
          }),
        )
      : measures,
  };
}

/** Measures every stock that Portolab tracks, which covers every stock that a student can buy or sell, from the stored closes. */
export function readStockRows(database: Database): StockRow[] {
  return measureStoredStocks(database, trackedStockCodes).map(
    ({ code, measures }) => ({
      code,
      measures: measures.ok
        ? succeed(summarizeStockRow(measures.value.stock))
        : measures,
    }),
  );
}

/** Measures one stock from the stored closes, with every input that its page shows. */
export function readStockMeasures(
  database: Database,
  code: string,
): Result<StockSummary, StoredMeasureFailure> {
  const [measured] = measureStoredStocks(database, [code]);
  if (measured === undefined) {
    throw new Error(
      `measureStoredStocks measures every code that it receives, but it gave nothing for ${code}.`,
    );
  }
  return measured.measures.ok
    ? succeed(summarizeStock(measured.measures.value))
    : fail(measured.measures.failure);
}
