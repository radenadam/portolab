import { expect, test } from "vitest";
import { measureRiskFreeRate } from "./measure-risk-free-rate";

// The rates come from the table of the BI-Rate of Bank Indonesia, and the expected rates of one period were computed with the decimal module of Python at 50 significant digits.
const biRateTable = "https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx";

test("divides the BI-Rate by 12 for a month and by 52 for a week", () => {
  expect(measureRiskFreeRate("2026-09-30", "monthly")).toEqual({
    ok: true,
    value: {
      formula: "ratePerPeriod",
      value: expect.closeTo(0.004791666666666666, 17) as number,
      inputs: {
        annualRate: 0.0575,
        periodsPerYear: 12,
        announcedOn: "2026-06-18",
        source: biRateTable,
      },
    },
  });
  const weekly = measureRiskFreeRate("2026-09-30", "weekly");
  expect(weekly.ok && weekly.value.value).toBeCloseTo(
    0.0011057692307692307,
    17,
  );
});

test("takes a rate from the day of its announcement on", () => {
  // Bank Indonesia announced 5.50% on 9 June 2026 and 5.75% on 18 June 2026.
  const dayBefore = measureRiskFreeRate("2026-06-17", "monthly");
  expect(dayBefore.ok && dayBefore.value.inputs).toEqual({
    annualRate: 0.055,
    periodsPerYear: 12,
    announcedOn: "2026-06-09",
    source:
      "https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2811926.aspx",
  });
  const dayOf = measureRiskFreeRate("2026-06-18", "monthly");
  expect(dayOf.ok && dayOf.value.inputs.annualRate).toBe(0.0575);
});

test("fails for a date before the first recorded BI-Rate", () => {
  expect(measureRiskFreeRate("2021-02-17", "monthly")).toEqual({
    ok: false,
    failure: { kind: "noRiskFreeRate", date: "2021-02-17" },
  });
});
