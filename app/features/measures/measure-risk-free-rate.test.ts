import { expect, test } from "vitest";
import { closeToForTest } from "./close-to-for-test";
import { measureRiskFreeRate } from "./measure-risk-free-rate";

// The rates come from the table of the BI-Rate of Bank Indonesia, and the expected rate of one month was computed with the decimal module of Python at 50 significant digits.
test("divides the BI-Rate by 12 for the rate of a month", () => {
  expect(measureRiskFreeRate("2026-09-30")).toEqual({
    ok: true,
    value: {
      formula: "ratePerMonth",
      value: closeToForTest(0.004791666666666666, 17),
      inputs: {
        annualRate: 0.0575,
        monthsPerYear: 12,
        announcedOn: "2026-06-18",
        source: "https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx",
      },
    },
  });
});

test("takes a rate from the day of its announcement on", () => {
  // Bank Indonesia announced 5.50% on 9 June 2026 and 5.75% on 18 June 2026.
  const dayBefore = measureRiskFreeRate("2026-06-17");
  expect(dayBefore.ok && dayBefore.value.inputs).toEqual({
    annualRate: 0.055,
    monthsPerYear: 12,
    announcedOn: "2026-06-09",
    source:
      "https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2811926.aspx",
  });
  const dayOf = measureRiskFreeRate("2026-06-18");
  expect(dayOf.ok && dayOf.value.inputs.annualRate).toBe(0.0575);
});

test("fails for a date before the first recorded BI-Rate", () => {
  expect(measureRiskFreeRate("2021-02-17")).toEqual({
    ok: false,
    failure: { kind: "noRiskFreeRate", date: "2021-02-17" },
  });
});
