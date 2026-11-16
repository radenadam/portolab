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
import { parseOptionalText } from "~/form-text";
import { analysisDataReturn } from "./analysis-data-return";

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

export function readAnalysisData(url: URL): boolean {
  // The hint restores a return address, so a forged hint must not block the normal page.
  const dataReturn = parseOptionalText(
    url.searchParams.get(analysisDataReturn.parameter),
    m.measures_analysis_data_label(),
  );
  return dataReturn.ok && dataReturn.value === analysisDataReturn.value;
}
