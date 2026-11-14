import {
  formatPercent,
  formatSharpeRatio,
  formatSignedPercent,
} from "~/formatting";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { SharpeRatio } from "~/units/sharpe-ratio";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { ComparedStudent } from "./student-filters";
import type { ComparedMeasures } from "./compared-measures";

export const rankingMeasures = ["alpha", "sharpe", "treynor"] as const;
export type RankingMeasure = (typeof rankingMeasures)[number];

export function rankingLabel(measure: RankingMeasure): string {
  const labels: Record<RankingMeasure, () => string> = {
    alpha: m.grading_market_line_label,
    sharpe: m.grading_sharpe_label,
    treynor: m.grading_treynor_label,
  };
  return labels[measure]();
}

export function rankingValue(
  student: ComparedStudent,
  measure: RankingMeasure,
): Result<MonthlyReturn | SharpeRatio, string> {
  if ("reason" in student) return fail(student.reason);
  const measures = student.measures;
  switch (measure) {
    case "alpha":
      return succeed(measures.distance);
    case "sharpe":
      return measures.sharpe;
    case "treynor":
      return measures.treynor;
  }
}

export function rankingText(
  measures: ComparedMeasures,
  measure: RankingMeasure,
): string {
  switch (measure) {
    case "alpha":
      return formatSignedPercent(measures.distance).text;
    case "sharpe":
      return measures.sharpe.ok
        ? formatSharpeRatio(measures.sharpe.value)
        : m.grading_unavailable_label();
    case "treynor":
      return measures.treynor.ok
        ? formatPercent(measures.treynor.value, "two")
        : m.grading_unavailable_label();
  }
}

export function studentRank(
  student: ComparedStudent,
  all: readonly ComparedStudent[],
  measure: RankingMeasure,
): { rank: number; total: number } | undefined {
  if (!rankingValue(student, measure).ok) return undefined;
  return {
    rank: all.findIndex((item) => item.studentId === student.studentId) + 1,
    total: all.filter((item) => rankingValue(item, measure).ok).length,
  };
}
