import { succeed } from "~/result";
import type { Result } from "~/result";
import { measureAgainstMarket } from "./capm";
import type { MarketMeasures, StockMeasures } from "./capm";
import type { EstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { alignedReturns } from "./period-returns";
import type { AlignedReturns, InstrumentCloses } from "./period-returns";
import { measureSeries } from "./return-statistics";
import { measureRiskFreeRate } from "./measure-risk-free-rate";

/** Measures one stock against the market, from the returns of the periods in the window of the settings in which both have a return. */
export function measureStock(
  stock: InstrumentCloses,
  market: InstrumentCloses,
  settings: EstimationSettings,
): Result<{ stock: StockMeasures; market: MarketMeasures }, MeasureFailure> {
  const returns = alignedReturns(market, [stock], settings);
  if (!returns.ok) {
    return returns;
  }
  const [stockReturns] = returns.value.instruments;
  if (stockReturns === undefined) {
    throw new Error(
      `alignedReturns gives the returns of every instrument that it receives, but it gave none for ${stock.code}.`,
    );
  }
  const marketMeasures = measureMarket(returns.value, settings);
  if (!marketMeasures.ok) {
    return marketMeasures;
  }
  return succeed({
    stock: measureAgainstMarket(
      stock.code,
      stockReturns.returns,
      marketMeasures.value,
    ),
    market: marketMeasures.value,
  });
}

/** Measures the returns of the market, with the risk-free rate on the day that ends the window. */
export function measureMarket(
  returns: AlignedReturns<unknown>,
  settings: EstimationSettings,
): Result<MarketMeasures, MeasureFailure> {
  const riskFreeRate = measureRiskFreeRate(
    returns.windowEnd,
    settings.frequency,
  );
  if (!riskFreeRate.ok) {
    return riskFreeRate;
  }
  return succeed({
    series: measureSeries(returns.market),
    riskFreeRate: riskFreeRate.value,
  });
}
