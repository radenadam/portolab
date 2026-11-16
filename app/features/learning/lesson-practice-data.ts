import type { AnalysisHolding } from "~/features/measures/analysis-holdings";
import type {
  MarketSummary,
  PortfolioSummary,
} from "~/features/measures/measure-summaries";
import type { StoredMeasureFailure } from "~/features/measures/measure-stored.server";
import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";
import type { Beta } from "~/units/beta";

export interface LessonPracticeData {
  initialBeta: Beta;
  report: PortfolioMeasuresReport | undefined;
  holdings: AnalysisHolding[];
  market: MarketSummary | undefined;
  marketFailure: StoredMeasureFailure | undefined;
  simulation: PortfolioSummary | undefined;
}
