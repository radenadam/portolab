import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioSummary, StockRowSummary } from "./measure-summaries";
import type { StudentLine, StockRow } from "./read-measures.server";

export type AnalysisHolding = Pick<
  StockRowSummary,
  | "beta"
  | "expectedReturn"
  | "standardDeviation"
  | "variance"
  | "requiredReturn"
  | "distance"
> & {
  code: string;
  weight: PortfolioWeight | undefined;
};

/** A portfolio's shared months win. Without them, only holdings on the latest market line appear. */
export function analysisHoldings(
  portfolio: PortfolioSummary | undefined,
  line: StudentLine | undefined,
  stocks: readonly StockRow[],
): AnalysisHolding[] {
  if (portfolio !== undefined) return portfolio.holdings;
  if (line?.kind !== "latest") return [];
  const codes = new Set(line.holdings.map((holding) => holding.code));
  const holdings: AnalysisHolding[] = [];
  for (const stock of stocks) {
    if (codes.has(stock.code) && stock.measures.ok)
      holdings.push({
        ...stock.measures.value,
        code: stock.code,
        weight: undefined,
      });
  }
  return holdings;
}
