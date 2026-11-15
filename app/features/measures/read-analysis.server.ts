import { parseAnalysisAxis } from "./parse-analysis-axis";
import { m } from "~/paraglide/messages.js";
import type { Database } from "~/database/database.server";
import type { PortfolioReport } from "~/features/trading/read-portfolio-report.server";
import {
  readPortfolioMeasures,
  readStockRows,
  readStudentLine,
} from "./read-measures.server";
import { measureStoredMarket } from "./measure-stored.server";
import { summarizeMarket } from "./measure-summaries";

export function readAnalysis(database: Database, report: PortfolioReport) {
  const measures = readPortfolioMeasures(database, report.valuation);
  const stocks = readStockRows(database);
  const market = measureStoredMarket(database);
  return {
    measures,
    marketLine: readStudentLine(
      database,
      { valuation: report.valuation, report: measures },
      stocks,
    ),
    market: market.ok ? summarizeMarket(market.value) : undefined,
    stocks,
  };
}

export function readAnalysisAxis(url: URL) {
  return parseAnalysisAxis(
    url.searchParams.get("axis"),
    m.measures_analysis_axis_label(),
  );
}
