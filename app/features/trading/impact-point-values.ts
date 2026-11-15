import type { TradeImpact } from "~/features/measures/measure-trade";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { marketBeta } from "~/units/beta";
import { m } from "~/paraglide/messages.js";

/** The map and its native table must compare the same portfolios, stock, and market. */
export function impactPointValues(
  { before, after }: TradeImpact,
  code: string,
) {
  const stock = before.holdings.find((holding) => holding.code === code);
  if (stock === undefined) throw new Error(`The impact measures lack ${code}.`);
  return {
    before: {
      key: "before",
      name: m.trading_impact_before_label(),
      beta: before.beta.value,
      risk: before.standardDeviation.value,
      expected: before.expectedReturn.value,
    },
    after: {
      key: "after",
      name: m.trading_impact_after_label(),
      beta: after.beta.value,
      risk: after.standardDeviation.value,
      expected: after.expectedReturn.value,
    },
    stock: {
      key: code,
      name: code,
      beta: stock.beta.value,
      risk: stock.standardDeviation.value,
      expected: stock.expectedReturn.value,
    },
    market: {
      key: marketIndex.code,
      name: marketIndex.code,
      beta: marketBeta,
      risk: before.market.standardDeviation.value,
      expected: before.market.expectedReturn.value,
    },
  };
}
