import { formatSignedPercent } from "~/formatting";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { MapPoint, MarkedPoint } from "./layout-risk-map";

/** A point of a map of beta against return, whose tooltip names both values. */
export function mapPointForTest(
  key: string,
  values: { beta: number; return: number },
): MapPoint<Beta, MonthlyReturn> {
  return {
    key,
    name: key,
    across: beta(values.beta),
    up: monthlyReturn(values.return),
    values: [
      { name: "Beta", value: String(values.beta) },
      { name: "Alpha", value: formatSignedPercent(values.return) },
    ],
  };
}

/** The points of layout-risk-map.test.ts, which places a beta b at b / 2.16 across the plot and a return r at (3.32% - r) / 4.64% down it, beside the IHSG at a beta of 1 and a return of 1%. The chart writes each position as a percentage with two decimals. */
export const marketPointForTest = mapPointForTest("IHSG", {
  beta: 1,
  return: 0.01,
});

export const markedPointsForTest: readonly MarkedPoint<Beta, MonthlyReturn>[] =
  [
    {
      ...mapPointForTest("Portofolio Anda", { beta: 0.5, return: 0.02 }),
      mark: { kind: "own" },
    },
    {
      ...mapPointForTest("BBCA", { beta: 1.5, return: -0.01 }),
      mark: { kind: "held", weight: portfolioWeight(0.25) },
    },
    {
      ...mapPointForTest("TLKM", { beta: 2, return: 0.03 }),
      mark: { kind: "other" },
    },
  ];
