import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import type { AnalysisHolding } from "~/features/measures/analysis-holdings";
import type {
  MarketSummary,
  PortfolioSummary,
} from "~/features/measures/measure-summaries";
import type { StoredMeasureFailure } from "~/features/measures/measure-stored.server";
import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";
import type { Beta } from "~/units/beta";
import type { SessionContent } from "./content";

export interface LessonPracticeData {
  initialBeta: Beta;
  report: PortfolioMeasuresReport | undefined;
  holdings: AnalysisHolding[];
  market: MarketSummary | undefined;
  marketFailure: StoredMeasureFailure | undefined;
  simulation: PortfolioSummary | undefined;
}

export interface LessonPracticeProps {
  classId: ClassId;
  lesson: SessionContent;
  practice: LessonPracticeData;
  /** The key terms, which the lesson shows between its numbers and its practice. */
  children: ReactNode;
  idPrefix?: string;
  /** The lesson page that a task in a sheet opens first. */
  taskPage?: string | undefined;
}
