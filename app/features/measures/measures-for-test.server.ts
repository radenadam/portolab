import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import {
  readPortfolioMeasures,
  readStockRows,
  readStudentLine,
} from "./read-measures.server";
import type { StockRow, StudentLine } from "./read-measures.server";

/** A database with the recorded month-end closes of the IHSG, BBCA, TLKM, AMMN, and AADI. */
export function databaseWithClosesForTest(): Database {
  const database = openDatabaseForTest();
  for (const code of ["IHSG", "BBCA", "TLKM", "AMMN", "AADI"] as const) {
    saveDailyHistory(database, monthEndClosesForTest(code));
  }
  return database;
}

// The quotes of 30 October 2026 that the fixture source records. They value 5,500 shares of BBCA at Rp27,390,000 and 8,300 shares of TLKM at Rp16,434,000, which with Rp10,956,000 in cash are 50%, 30%, and 20% of Rp54,780,000. Each cost is the value with a broker fee of 0.15%.
const quotes: Record<"BBCA" | "TLKM", StockQuote> = {
  BBCA: stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55.000Z"),
  TLKM: stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:51.000Z"),
};
const holdings = {
  BBCA: { code: "BBCA", shares: shares(5_500), cost: rupiah(27_431_085) },
  TLKM: { code: "TLKM", shares: shares(8_300), cost: rupiah(16_458_651) },
};

/** A portfolio of BBCA, TLKM, and cash at the quotes of 30 October 2026, valued with the quotes of the codes that a test gives, and the other holdings without a price. The page of the measures never shows the starting cash. */
export function valuationForTest(
  quotedCodes: readonly ("BBCA" | "TLKM")[],
): PortfolioValuation {
  return valuePortfolio(
    { cash: rupiah(10_956_000), holdings: [holdings.BBCA, holdings.TLKM] },
    rupiah(100_000_000),
    new Map(quotedCodes.map((code) => [code, quotes[code]])),
  );
}

/** A portfolio of 1,000 shares of AADI and cash, valued at the quote of 30 October 2026 that the fixture source records, which values the shares at Rp11,475,000. They cost Rp11,492,213 with a broker fee of 0.15%. AADI has too few monthly returns for measures. */
export function aadiValuationForTest(): PortfolioValuation {
  return valuePortfolio(
    {
      cash: rupiah(10_000_000),
      holdings: [
        { code: "AADI", shares: shares(1_000), cost: rupiah(11_492_213) },
      ],
    },
    rupiah(21_492_213),
    new Map([
      [
        "AADI",
        stockQuote("AADI", [11_475, 11_125], "2026-10-30T09:14:58.000Z"),
      ],
    ]),
  );
}

/** A portfolio of 1,000 shares of AMMN and cash, valued at the quote of 30 October 2026 that the fixture source records, which values the shares at Rp3,650,000. They cost Rp3,655,475 with a broker fee of 0.15%. AMMN listed in July 2023, so the measures of the portfolio use fewer months than those of a stock with five years of returns. */
export function ammnValuationForTest(): PortfolioValuation {
  return valuePortfolio(
    {
      cash: rupiah(10_000_000),
      holdings: [
        { code: "AMMN", shares: shares(1_000), cost: rupiah(3_655_475) },
      ],
    },
    rupiah(13_655_475),
    new Map([
      ["AMMN", stockQuote("AMMN", [3_650, 3_740], "2026-10-30T09:14:16.000Z")],
    ]),
  );
}

/** A portfolio of the starting cash of Rp100,000,000 alone, which holds no shares. */
export function cashValuationForTest(): PortfolioValuation {
  return valuePortfolio(
    { cash: rupiah(100_000_000), holdings: [] },
    rupiah(100_000_000),
    new Map(),
  );
}

/** The line that the page of the measures of a student draws for a portfolio, from the measures of its valuation as the loader of the page reads them, against every stock that Portolab tracks or the stocks that a test gives. */
export function studentLineForTest(
  database: Database,
  valuation: PortfolioValuation,
  stocks: readonly StockRow[] = readStockRows(database),
): Result<StudentLine, StoredMeasureFailure> {
  return readStudentLine(
    database,
    { valuation, report: readPortfolioMeasures(database, valuation) },
    stocks,
  );
}
