import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";

/** The returns of the portfolio that tradedPortfolioForTest leaves and of the IHSG at the closes of 30 October, 2 November, and 3 November 2026, which the tests of portfolio-history.ts give with the values of the decimal module of Python. */
export const returnPointsForTest: readonly {
  date: string;
  portfolio: CumulativeReturn;
  market: CumulativeReturn;
}[] = [
  {
    date: "2026-10-30",
    portfolio: cumulativeReturn(0),
    market: cumulativeReturn(0),
  },
  {
    date: "2026-11-02",
    portfolio: cumulativeReturn(-0.001494),
    market: cumulativeReturn(0.00786624613163801),
  },
  {
    date: "2026-11-03",
    portfolio: cumulativeReturn(-0.030704),
    market: cumulativeReturn(-0.03020733431546059),
  },
];
