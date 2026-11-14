import {
  formatBeta,
  formatNumber,
  formatReturnPoints,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { marketBeta } from "~/features/measures/market-beta";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";

/** A median keeps an extreme portfolio from dominating the class comparison. */
function medianOf<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
): Value | undefined {
  const ordered = values.toSorted((first, second) => first - second);
  const middle = Math.floor(ordered.length / 2);
  const upper = ordered[middle];
  if (upper === undefined) return undefined;
  const lower = ordered[middle - 1];
  return ordered.length % 2 === 0 && lower !== undefined
    ? toValue((lower + upper) / 2)
    : upper;
}

/** Students can join on different days, so the headline compares their own periods and takes its sign from the rounded display. */
export function classSummary(
  compared: readonly {
    portfolio: CumulativeReturn;
    market: CumulativeReturn;
  }[],
  risks: readonly Beta[],
): {
  headline: string;
  sentence: string;
  medianBeta: string;
  medianReturn: CumulativeReturn | undefined;
  marketReturn: CumulativeReturn | undefined;
} {
  const difference = medianOf(
    compared.map(({ portfolio, market }) =>
      cumulativeReturn(portfolio - market),
    ),
    cumulativeReturn,
  );
  const medianReturn = medianOf(
    compared.map(({ portfolio }) => portfolio),
    cumulativeReturn,
  );
  const marketReturn = medianOf(
    compared.map(({ market }) => market),
    cumulativeReturn,
  );
  const medianBeta = medianOf(risks, beta);
  let above = 0;
  for (const { portfolio, market } of compared) {
    if (formatSignedPercent(portfolio - market).direction === "rise")
      above += 1;
  }
  let calmer = 0;
  const displayedMarketBeta = formatBeta(marketBeta);
  for (const risk of risks) {
    if (risk < marketBeta && formatBeta(risk) !== displayedMarketBeta)
      calmer += 1;
  }
  const headline =
    difference === undefined
      ? m.classes_comparison_pending_title()
      : comparisonHeadline(difference);
  return {
    headline,
    sentence:
      medianReturn === undefined || marketReturn === undefined
        ? m.classes_comparison_pending_notice()
        : m.classes_comparison_notice({
            portfolio: formatSignedPercent(medianReturn).text,
            market: formatSignedPercent(marketReturn).text,
            above: abovePart(above, compared.length),
            calmer: calmerPart(calmer, risks.length),
          }),
    medianBeta:
      medianBeta === undefined
        ? m.classes_measure_pending_label()
        : formatBeta(medianBeta),
    medianReturn,
    marketReturn,
  };
}

function abovePart(above: number, count: number): string {
  if (above === 0) return m.classes_above_none_part();
  if (count === 1) return m.classes_above_one_student_part();
  if (above === count)
    return m.classes_above_all_part({ count: formatNumber(count) });
  return above === 1
    ? m.classes_one_above_student_part({ count: formatNumber(count) })
    : m.classes_several_above_students_part({
        above: formatNumber(above),
        count: formatNumber(count),
      });
}

function calmerPart(calmer: number, count: number): string {
  if (count === 0) return m.classes_calmer_unmeasured_part();
  if (count === 1)
    return calmer === 1
      ? m.classes_calmer_one_part()
      : m.classes_calmer_one_not_part();
  if (calmer === 0) return m.classes_calmer_none_part();
  if (calmer === count)
    return m.classes_calmer_all_part({ count: formatNumber(count) });
  return calmer === 1
    ? m.classes_one_calmer_portfolio_part({ count: formatNumber(count) })
    : m.classes_several_calmer_portfolios_part({
        calmer: formatNumber(calmer),
        count: formatNumber(count),
      });
}

const onePointDifference = cumulativeReturn(0.01);

function comparisonHeadline(difference: CumulativeReturn): string {
  const rounded = formatSignedPercent(difference);
  const points = formatReturnPoints(difference);
  const isOne = points === formatReturnPoints(onePointDifference);
  switch (rounded.direction) {
    case "rise":
      return isOne
        ? m.classes_one_ahead_point_title({ points })
        : m.classes_several_ahead_points_title({ points });
    case "fall":
      return isOne
        ? m.classes_one_behind_point_title({ points })
        : m.classes_several_behind_points_title({ points });
    case "none":
      return m.classes_comparison_equal_title();
  }
}
