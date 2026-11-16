import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";

export function practicePortfolio(report: PortfolioMeasuresReport | undefined) {
  return report?.kind === "measured" && report.measures.ok
    ? report.measures.value
    : undefined;
}
