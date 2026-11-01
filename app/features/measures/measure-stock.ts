import { succeed } from "~/result";
import type { Result } from "~/result";
import { measureAgainstMarket, measureMarket } from "./capm";
import type { MarketMeasures, StockMeasures } from "./capm";
import type { EstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { alignedReturns } from "./aligned-returns";
import type { InstrumentCloses } from "./aligned-returns";

/** Measures one stock against the market, from the returns of the months in the window of the settings in which both have a return. */
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
  const marketMeasures = measureMarket(returns.value);
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
