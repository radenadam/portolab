import type { Database } from "~/database/database.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Rupiah } from "~/units/rupiah";
import type { MarketLine } from "./capm";
import {
  summarizeMarket,
  summarizePortfolio,
  summarizeStock,
  summarizeStockRow,
} from "./measure-summaries";
import type {
  MarketSummary,
  PortfolioSummary,
  StockRowSummary,
  StockSummary,
} from "./measure-summaries";
import {
  measureStoredMarket,
  measureStoredPortfolio,
  measureStoredStocks,
} from "./measure-stored.server";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthSpanOf } from "./month-span";
import type { MonthSpan } from "./month-span";

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

/** A stock or a portfolio that a chart of the security market line places, with how far its expected return lies above the line, or below it when negative, which is α. */
export interface LinePoint {
  beta: Beta;
  expectedReturn: MonthlyReturn;
  distance: MonthlyReturn;
}

export interface StockOnLine extends LinePoint {
  code: string;
}

/** The security market line that a chart draws, with the months whose returns give it. */
export interface ChartedLine extends MarketLine {
  months: MonthSpan;
}

/** The line of the months of a portfolio with measures, and the portfolio and its stocks over those months, which all lie against that line. */
export interface PortfolioLine {
  line: ChartedLine;
  portfolio: LinePoint;
  /** In the order of the portfolio. */
  holdings: StockOnLine[];
}

/** The stocks that a portfolio does not hold against the line of a chart, and every stock that is not on the chart. */
export interface OtherStocks {
  /** The stocks that the portfolio does not hold whose measures use the months of the line, in the order of every stock. */
  onLine: StockOnLine[];
  /** The stocks whose measures use other months, which give another line. */
  otherLineCodes: string[];
  /** Whether a stock has no measures, which the table of every stock explains. */
  hasUnmeasured: boolean;
}

/** What the chart of the page of a student draws: the line of the months of the portfolio with the portfolio and its stocks, or the line of the latest complete months of the IHSG while the portfolio has no measures, with the stocks of the portfolio whose own measures use those months. Each comes with the other stocks against the line. */
export type StudentLine =
  | { kind: "portfolio"; portfolioLine: PortfolioLine; others: OtherStocks }
  | {
      kind: "latest";
      line: ChartedLine;
      /** In the order of every stock. */
      holdings: StockOnLine[];
      others: OtherStocks;
    };

/** The line of the months of a portfolio with its stocks, or undefined while the portfolio has no measures. */
export function readPortfolioLine(
  report: PortfolioMeasuresReport,
): PortfolioLine | undefined {
  if (report.kind !== "measured" || !report.measures.ok) {
    return undefined;
  }
  const portfolio = report.measures.value;
  return {
    line: chartedLine(portfolio.market),
    portfolio: {
      beta: portfolio.beta,
      expectedReturn: portfolio.expectedReturn,
      distance: portfolio.securityMarketLine.value,
    },
    holdings: portfolio.holdings.map(
      ({ code, beta, expectedReturn, distance }) => ({
        code,
        beta,
        expectedReturn,
        distance,
      }),
    ),
  };
}

/** The line that the chart of the page of a student draws, with the portfolio, its stocks, and the other stocks that Portolab tracks against it, or why the stored closes give no line. The measures of the portfolio are those of its valuation. */
export function readStudentLine(
  database: Database,
  portfolio: { valuation: PortfolioValuation; report: PortfolioMeasuresReport },
  stocks: readonly StockRow[],
): Result<StudentLine, StoredMeasureFailure> {
  // A portfolio without measures still holds its stocks, such as one without a delayed price, so the chart tells them apart from the other stocks in every state.
  const heldCodes = new Set(
    portfolio.valuation.holdings.map(({ code }) => code),
  );
  const isHeld = ({ code }: { code: string }): boolean => heldCodes.has(code);
  const portfolioLine = readPortfolioLine(portfolio.report);
  if (portfolioLine !== undefined) {
    return succeed({
      kind: "portfolio",
      portfolioLine,
      others: againstLine(
        portfolioLine.line,
        stocks.filter((stock) => !isHeld(stock)),
      ),
    });
  }
  const market = measureStoredMarket(database);
  if (!market.ok) {
    return market;
  }
  const line = chartedLine(summarizeMarket(market.value));
  const against = againstLine(line, stocks);
  return succeed({
    kind: "latest",
    line,
    holdings: against.onLine.filter(isHeld),
    others: {
      ...against,
      onLine: against.onLine.filter((stock) => !isHeld(stock)),
    },
  });
}

function chartedLine(market: MarketSummary): ChartedLine {
  return {
    riskFreeRate: market.riskFreeRate.value,
    marketExpectedReturn: market.expectedReturn,
    months: monthSpanOf(market.returns),
  };
}

function againstLine(
  line: MarketLine,
  stocks: readonly StockRow[],
): OtherStocks {
  const others: OtherStocks = {
    onLine: [],
    otherLineCodes: [],
    hasUnmeasured: false,
  };
  for (const { code, measures } of stocks) {
    if (!measures.ok) {
      others.hasUnmeasured = true;
    } else if (isSameLine(measures.value.line, line)) {
      const { beta, expectedReturn, distance } = measures.value;
      others.onLine.push({ code, beta, expectedReturn, distance });
    } else {
      others.otherLineCodes.push(code);
    }
  }
  return others;
}

// The same months give the same risk-free rate and the same expected return of the IHSG, and measures over other months lie against another line, so a stock lies at its own distance from the line of a chart exactly when it shares both.
function isSameLine(first: MarketLine, second: MarketLine): boolean {
  return (
    first.riskFreeRate === second.riskFreeRate &&
    first.marketExpectedReturn === second.marketExpectedReturn
  );
}
