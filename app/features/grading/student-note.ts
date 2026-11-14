import {
  formatBeta,
  formatList,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { RankedStudent } from "./read-class-portfolios.server";
import type { ComparedStudent } from "./student-filters";

/** The note uses the rounded values that the panel shows, so it never calls a rounded zero a gain or a loss. */
export function studentNote(
  student: ComparedStudent,
  all: readonly ComparedStudent[],
): string {
  if (!("measures" in student)) return student.reason;
  const summary = comparisonNote(student, all);
  const values = {
    beta: formatBeta(student.measures.beta),
    alpha: formatSignedPercent(student.measures.distance).text,
  };
  switch (formatSignedPercent(student.measures.distance).direction) {
    case "rise":
      return [summary, m.grading_above_line_notice(values)]
        .filter(Boolean)
        .join(" ");
    case "fall":
      return [summary, m.grading_below_line_notice(values)]
        .filter(Boolean)
        .join(" ");
    case "none":
      return [summary, m.grading_on_line_notice(values)]
        .filter(Boolean)
        .join(" ");
  }
}

type ComparisonMeasure = "return" | "risk" | "alpha";

function comparisonNote(
  student: RankedStudent,
  all: readonly ComparedStudent[],
): string {
  const measured = all.filter((item) => "measures" in item);
  if (measured.length === 1) return m.grading_one_measured_portfolio_notice();
  const metrics: Record<
    ComparisonMeasure,
    {
      value: (item: ComparedStudent) => number | undefined;
      highest: () => string;
      lowest: () => string;
    }
  > = {
    return: {
      value: (item) => item.total?.return,
      highest: m.grading_highest_return_part,
      lowest: m.grading_lowest_return_part,
    },
    risk: {
      value: (item) =>
        "measures" in item ? item.measures.standardDeviation : undefined,
      highest: m.grading_highest_risk_part,
      lowest: m.grading_lowest_risk_part,
    },
    alpha: {
      value: (item) =>
        "measures" in item ? item.measures.distance : undefined,
      highest: m.grading_highest_alpha_part,
      lowest: m.grading_lowest_alpha_part,
    },
  };
  const facts: string[] = [];
  for (const metric of Object.values(metrics)) {
    const values = all.map(metric.value).filter((value) => value !== undefined);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const value = metric.value(student);
    if (maximum === minimum) continue;
    if (value === maximum) facts.push(metric.highest());
    if (value === minimum) facts.push(metric.lowest());
  }
  if (facts.length > 0)
    return m.grading_extremes_notice({
      facts: formatList(facts, "conjunction"),
    });
  return m.grading_median_notice({
    returns:
      student.total === undefined
        ? m.grading_unavailable_label()
        : medianPosition(
            student.total.return,
            all.flatMap((item) =>
              item.total === undefined ? [] : [item.total.return],
            ),
            (value) => formatSignedPercent(value).text,
          ),
    risk: medianPosition(
      student.measures.standardDeviation,
      measured.map((item) => item.measures.standardDeviation),
      (value) => formatPercent(value, "two"),
    ),
  });
}

function medianPosition<Value extends number>(
  value: Value,
  values: readonly Value[],
  format: (value: number) => string,
): string {
  const sorted = values.toSorted((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  const right = sorted[middle];
  const left = sorted.length % 2 === 0 ? sorted[middle - 1] : right;
  if (left === undefined || right === undefined)
    throw new Error("A class comparison needs a measured portfolio.");
  const median = (left + right) / 2;
  if (format(value) === format(median)) return m.grading_equal_median_part();
  return value > median
    ? m.grading_above_median_part()
    : m.grading_below_median_part();
}
