import { countedText } from "~/counted-text";
import {
  formatPercent,
  formatSignedPercent,
  formatPercentagePoints,
  isOnePercentagePoint,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MonthlyReturn } from "~/units/monthly-return";
import { diversificationChanged } from "./diversification-changed";

export interface AnalysisInsight {
  text: string;
  numbers: readonly string[];
}

/** The displayed precision chooses the words, so a distance rounded to zero lies on the line. */
export function analysisAlphaInsight(
  distance: MonthlyReturn,
  studentName?: string,
): AnalysisInsight {
  const value = formatPercentagePoints(Math.abs(distance));
  const inputs = { distance: value, name: studentName ?? "" };
  switch (formatSignedPercent(distance).direction) {
    case "rise":
      return {
        text: countedText(
          isOnePercentagePoint(value) ? 1 : 2,
          {
            one:
              studentName === undefined
                ? m.measures_analysis_one_above_point_notice
                : m.measures_analysis_student_one_above_point_notice,
            several:
              studentName === undefined
                ? m.measures_analysis_several_above_points_notice
                : m.measures_analysis_student_several_above_points_notice,
          },
          inputs,
        ),
        numbers: [value],
      };
    case "fall":
      return {
        text: countedText(
          isOnePercentagePoint(value) ? 1 : 2,
          {
            one:
              studentName === undefined
                ? m.measures_analysis_one_below_point_notice
                : m.measures_analysis_student_one_below_point_notice,
            several:
              studentName === undefined
                ? m.measures_analysis_several_below_points_notice
                : m.measures_analysis_student_several_below_points_notice,
          },
          inputs,
        ),
        numbers: [value],
      };
    case "none":
      return {
        text:
          studentName === undefined
            ? m.measures_analysis_on_notice()
            : m.measures_analysis_student_on_notice({ name: studentName }),
        numbers: [],
      };
  }
}

export function analysisDiversificationInsight(
  average: MonthlyReturn,
  portfolio: MonthlyReturn,
): AnalysisInsight {
  const inputs = {
    average: formatPercent(average, "two"),
    portfolio: formatPercent(portfolio, "two"),
  };
  const text = diversificationChanged(average, portfolio)
    ? m.measures_analysis_diversification_notice(inputs)
    : m.measures_analysis_equal_risk_notice(inputs);
  return { text, numbers: [inputs.average, inputs.portfolio] };
}
