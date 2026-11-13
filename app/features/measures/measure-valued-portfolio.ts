import { succeed } from "~/result";
import type { Result } from "~/result";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { InstrumentCloses } from "./aligned-returns";
import type { EstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { measurePortfolio } from "./measure-portfolio";
import type { PortfolioMeasures } from "./measure-portfolio";

/** A stock of a portfolio with its closes and the value of its shares at the latest delayed price of the stock. */
export interface HoldingWithValue extends InstrumentCloses {
  value: Rupiah;
}

/** The measures of a portfolio, with the share of its value that its cash has. */
export type ValuedPortfolioMeasures = PortfolioMeasures & {
  cashWeight: PortfolioWeight;
};

/** Measures a portfolio from the value of each holding and the cash, which is the rest of the value of the portfolio. The weight of a holding or of the cash is its share of that whole value. */
export function measureValuedPortfolio(
  portfolio: { holdings: readonly HoldingWithValue[]; cash: Rupiah },
  market: InstrumentCloses,
  settings: EstimationSettings,
): Result<ValuedPortfolioMeasures, MeasureFailure> {
  let wholeValue = portfolio.cash;
  for (const holding of portfolio.holdings) {
    wholeValue = rupiah(wholeValue + holding.value);
  }
  const measures = measurePortfolio(
    portfolio.holdings.map(({ code, closes, value }) => ({
      code,
      closes,
      weight: portfolioWeight(value / wholeValue),
    })),
    market,
    settings,
  );
  if (!measures.ok) {
    return measures;
  }
  return succeed({
    ...measures.value,
    cashWeight: portfolioWeight(portfolio.cash / wholeValue),
  });
}
