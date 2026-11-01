import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { annualRate } from "~/units/annual-rate";
import type { AnnualRate } from "~/units/annual-rate";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Measure, MeasureFailure } from "./measure";

/** A BI-Rate that the Board of Governors of Bank Indonesia set. */
interface PolicyRate {
  /** The day on which Bank Indonesia announced the rate, which its table of the BI-Rate lists. */
  announcedOn: string;
  rate: AnnualRate;
  /** The page of Bank Indonesia that states the rate: the press release of the decision, or the table of the BI-Rate when no press release was found. */
  source: string;
}

const biRateTable = "https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx";

function pressRelease(page: string): string {
  return `https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/${page}.aspx`;
}

// Decision 0013 explains why the BI-Rate is the risk-free rate. Each entry is a decision that changed the rate, oldest first, as the table of Bank Indonesia listed them on 1 November 2026. The decisions that kept the rate are left out, because they change nothing.
const policyRates: readonly PolicyRate[] = [
  {
    announcedOn: "2021-02-18",
    rate: annualRate(0.035),
    source: pressRelease("sp_234221"),
  },
  {
    announcedOn: "2022-08-23",
    rate: annualRate(0.0375),
    source: pressRelease("sp_2422622"),
  },
  {
    announcedOn: "2022-09-22",
    rate: annualRate(0.0425),
    source: pressRelease("sp_2425322"),
  },
  {
    announcedOn: "2022-10-20",
    rate: annualRate(0.0475),
    source: pressRelease("sp_2428522"),
  },
  {
    announcedOn: "2022-11-17",
    rate: annualRate(0.0525),
    source: pressRelease("sp_2431322"),
  },
  {
    announcedOn: "2022-12-22",
    rate: annualRate(0.055),
    source: pressRelease("sp_2435022"),
  },
  {
    announcedOn: "2023-01-19",
    rate: annualRate(0.0575),
    source: pressRelease("sp_251323"),
  },
  {
    announcedOn: "2023-10-19",
    rate: annualRate(0.06),
    source: pressRelease("sp_2528323"),
  },
  { announcedOn: "2024-04-24", rate: annualRate(0.0625), source: biRateTable },
  { announcedOn: "2024-09-18", rate: annualRate(0.06), source: biRateTable },
  {
    announcedOn: "2025-01-15",
    rate: annualRate(0.0575),
    source: pressRelease("sp_270825"),
  },
  {
    announcedOn: "2025-05-21",
    rate: annualRate(0.055),
    source: pressRelease("sp_2711125"),
  },
  {
    announcedOn: "2025-07-16",
    rate: annualRate(0.0525),
    source: pressRelease("sp_2715325"),
  },
  {
    announcedOn: "2025-08-20",
    rate: annualRate(0.05),
    source: pressRelease("sp_2719425"),
  },
  {
    announcedOn: "2025-09-17",
    rate: annualRate(0.0475),
    source: pressRelease("sp_2721925"),
  },
  {
    announcedOn: "2026-05-20",
    rate: annualRate(0.0525),
    source: pressRelease("sp_2810726"),
  },
  {
    announcedOn: "2026-06-09",
    rate: annualRate(0.055),
    source: pressRelease("sp_2811926"),
  },
  { announcedOn: "2026-06-18", rate: annualRate(0.0575), source: biRateTable },
];

// Decision 0013 explains why the rate of a month is the yearly rate divided by the months of a year.
const monthsPerYear = 12;

/** The risk-free rate of one month, from the BI-Rate on a date. */
export type RiskFreeRateMeasure = Measure<
  "ratePerMonth",
  MonthlyReturn,
  {
    annualRate: AnnualRate;
    monthsPerYear: number;
    /** The day on which Bank Indonesia announced the BI-Rate. */
    announcedOn: string;
    source: string;
  }
>;

/** Measures the risk-free rate of one month on a date, from the latest BI-Rate announced on or before it. It fails for a date before the first recorded BI-Rate. */
export function measureRiskFreeRate(
  date: string,
): Result<RiskFreeRateMeasure, MeasureFailure> {
  let latestRate: PolicyRate | undefined;
  for (const policyRate of policyRates) {
    if (policyRate.announcedOn <= date) {
      latestRate = policyRate;
    }
  }
  if (latestRate === undefined) {
    return fail({ kind: "noRiskFreeRate", date });
  }
  return succeed({
    formula: "ratePerMonth",
    value: monthlyReturn(latestRate.rate / monthsPerYear),
    inputs: {
      annualRate: latestRate.rate,
      monthsPerYear,
      announcedOn: latestRate.announcedOn,
      source: latestRate.source,
    },
  });
}
