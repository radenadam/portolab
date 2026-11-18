import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { Correlation } from "~/units/correlation";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { plotFraction } from "~/units/plot-fraction";
import { fractionOf } from "~/charts/scale";
import type { LabelledMark } from "~/charts/map-labels";
import { smallestPercentStep } from "~/formatting";
import { twoStockAllocation } from "./two-stock-allocation";

export type TwoStockPointKind = "stockPoint" | "averagePoint" | "ownPoint";
export const twoStockMarkRadii: Record<TwoStockPointKind, number> = {
  stockPoint: 0.5,
  averagePoint: 0.5,
  ownPoint: 0.65,
};
export const twoStockPortfolioKey = "portfolio";
const curveSteps = 40;
export function layoutTwoStockCurve(
  portfolio: PortfolioSummary,
  {
    first,
    second,
    weight,
    rho,
  }: {
    first: string;
    second: string;
    weight: PortfolioWeight;
    rho: Correlation;
  },
) {
  const curve: {
    weight: PortfolioWeight;
    risk: MonthlyReturn;
    expected: MonthlyReturn;
  }[] = [];
  for (let step = 0; step <= curveSteps; step++) {
    const pointWeight = portfolioWeight(step / curveSteps);
    const measured = twoStockAllocation(portfolio, {
      first,
      second,
      weight: pointWeight,
      correlation: rho,
    });
    curve.push({
      weight: pointWeight,
      risk: measured.standardDeviation.value,
      expected: measured.expectedReturn.value,
    });
  }
  const selected = twoStockAllocation(portfolio, {
    first,
    second,
    weight,
    correlation: rho,
  });
  const firstPoint = curve.at(-1);
  const secondPoint = curve[0];
  if (firstPoint === undefined || secondPoint === undefined)
    throw new Error("The two-stock curve has no endpoints.");
  const across = {
    min: monthlyReturn(0),
    max: monthlyReturn(
      Math.max(firstPoint.risk, secondPoint.risk, smallestPercentStep) * 1.15,
    ),
  };
  const up = {
    min: monthlyReturn(
      Math.min(firstPoint.expected, secondPoint.expected) -
        Math.max(
          Math.abs(firstPoint.expected - secondPoint.expected) * 0.15,
          smallestPercentStep,
        ),
    ),
    max: monthlyReturn(
      Math.max(firstPoint.expected, secondPoint.expected) +
        Math.max(
          Math.abs(firstPoint.expected - secondPoint.expected) * 0.15,
          smallestPercentStep,
        ),
    ),
  };

  const acrossPosition = (value: MonthlyReturn) =>
    plotFraction(fractionOf(across, value));
  const upPosition = (value: MonthlyReturn) =>
    plotFraction(1 - fractionOf(up, value));
  const mark = (
    key: string,
    point: { risk: MonthlyReturn; expected: MonthlyReturn },
    kind: TwoStockPointKind,
  ): LabelledMark => ({
    key,
    position: { x: acrossPosition(point.risk), y: upPosition(point.expected) },
    outerRadius: twoStockMarkRadii[kind],
  });
  const marks = [
    mark(
      twoStockPortfolioKey,
      {
        risk: selected.standardDeviation.value,
        expected: selected.expectedReturn.value,
      },
      "ownPoint",
    ),
    mark(first, firstPoint, "stockPoint"),
    mark(second, secondPoint, "stockPoint"),
    mark(
      "average",
      { risk: selected.averageRisk, expected: selected.expectedReturn.value },
      "averagePoint",
    ),
  ];
  return {
    curve,
    selected,
    firstPoint,
    secondPoint,
    across,
    up,
    acrossPosition,
    upPosition,
    marks,
  };
}
