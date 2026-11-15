import {
  databaseWithClosesForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { succeed } from "~/result";
import { cumulativeReturn } from "~/units/cumulative-return";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import type { PortfolioValuation } from "./value-portfolio";

export function homePortfolioForTest(
  valuation: PortfolioValuation = valuationForTest(["BBCA", "TLKM"]),
  now = new Date("2026-10-30T10:00:00Z"),
): HomePortfolioData {
  const database = databaseWithClosesForTest();
  return {
    view: "map",
    classmates: [],
    sessions: [],
    stockBetas: [],
    report: {
      market: undefined,
      valuation,
      quoteAttempt: undefined,
      history: succeed({
        points: [
          {
            date: "2026-10-30",
            portfolio: cumulativeReturn(0),
            market: cumulativeReturn(0),
          },
        ],
        end: { kind: "missingCloses", date: "2026-11-02", codes: ["IHSG"] },
      }),
    },
    measures: readPortfolioMeasures(database, valuation),
    dayChange: readPortfolioDayChange(database, {
      portfolio: {
        cash: valuation.cash,
        holdings: valuation.holdings,
        orders: [],
      },
      valuation,
      now,
      delayMinutes: 10,
    }),
    setAside: { amount: rupiah(2_989_478), orders: 2 },
    lotShares: shares(100),
    histories: [],
    now,
    delayMinutes: 10,
  };
}
