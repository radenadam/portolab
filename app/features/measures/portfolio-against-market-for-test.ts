import type { Locale } from "~/paraglide/runtime.js";
import { succeed } from "~/result";
import { successValueForTest } from "~/success-value-for-test";
import type { Rupiah } from "~/units/rupiah";
import type { HoldingWithValue } from "./measure-valued-portfolio";
import { rupiah } from "~/units/rupiah";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { defaultEstimationSettings } from "./estimation-settings";
import { summarizePortfolio } from "./measure-summaries";
import { measureValuedPortfolio } from "./measure-valued-portfolio";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import type { PortfolioMeasuresReport } from "./read-measures.server";

/** The measures of a portfolio of Rp5,000,000 in an invented stock whose price rises when the IHSG falls, and Rp5,000,000 in cash. The close of the stock at the end of each month is Rp31,000,000 divided by the close of the IHSG, rounded to a whole rupiah. No stock of the fixtures moves against the IHSG, so the stock takes a code that no stock of IDX has. */
export function portfolioAgainstMarketForTest(): PortfolioMeasuresReport {
  const ihsg = monthEndClosesForTest("IHSG");
  const holding = {
    code: "CONTRA",
    closes: ihsg.closes.map(({ date, close }) => ({
      date,
      close: splitAdjustedRupiah(Math.round(31_000_000 / close)),
    })),
    value: rupiah(5_000_000),
  };
  const cash = rupiah(5_000_000);
  return measuredReportForTest([holding], cash);
}

/** These invented stocks have offsetting returns, so the portfolio has no variation even though each stock varies. */
export function portfolioWithoutVariationForTest(): PortfolioMeasuresReport {
  // By hand, returns of 1 and -0.5 for one stock and -0.5 and 1 for the other give 0.25 every month at equal weights.
  const dates = monthEndClosesForTest("IHSG").closes;
  const holdings = [
    { code: "OFFSET-A", alternateClose: 2000 },
    { code: "OFFSET-B", alternateClose: 500 },
  ].map(({ code, alternateClose }) => ({
    code,
    closes: dates.map(({ date }, index) => ({
      date,
      close: splitAdjustedRupiah(index % 2 === 0 ? 1000 : alternateClose),
    })),
    value: rupiah(5_000_000),
  }));
  return measuredReportForTest(holdings, rupiah(0));
}

function measuredReportForTest(
  holdings: readonly HoldingWithValue[],
  cash: Rupiah,
): PortfolioMeasuresReport {
  const measures = successValueForTest(
    measureValuedPortfolio(
      { holdings, cash },
      monthEndClosesForTest("IHSG"),
      defaultEstimationSettings,
    ),
    "The invented stocks have the 60 monthly returns of the IHSG",
  );
  return {
    kind: "measured",
    measures: succeed(
      summarizePortfolio(measures, {
        holdings,
        cash,
        total: rupiah(10_000_000),
      }),
    ),
  };
}

export const negativeTreynorTextForTest: Record<Locale, string> = {
  id: "Rasio Treynor membagi imbal hasil di atas suku bunga bebas risiko dengan beta, sehingga memerlukan beta di atas nol, tetapi beta portofolio ini -0,52. Beta nol membuat pembagian itu tidak terdefinisi, dan beta di bawah nol akan membuat imbal hasil di bawah suku bunga bebas risiko tampak sebagai imbalan atas risiko. Portolab menghitung rasio ini setelah suatu order tereksekusi atau pembaruan riwayat harga memberi portofolio beta di atas nol.",
  en: "The Treynor ratio divides the return above the risk-free rate by beta, so it needs a beta above zero, but the beta of the portfolio is -0.52. A beta of zero leaves the division undefined, and a beta below zero would turn a return below the risk-free rate into a reward for risk. Portolab computes the ratio once an order fills or an update of the price history gives the portfolio a beta above zero.",
};
