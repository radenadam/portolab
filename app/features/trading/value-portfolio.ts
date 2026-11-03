import { priceChange } from "~/features/market-data/price-change";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Holding } from "./holding-after-fill";

/** A holding at the latest delayed price of its stock, or without a price while Portolab has stored no quote of the stock. */
export type ValuedHolding = Holding &
  (
    | {
        kind: "priced";
        quote: StockQuote;
        /** The shares times the delayed price. */
        value: Rupiah;
        /** The value less the cost, which is a loss when it is below zero. */
        gain: Rupiah;
        /** The gain as a share of the cost. */
        gainReturn: CumulativeReturn;
      }
    | { kind: "unpriced" }
  );

/** The value of a portfolio and its holdings at the latest delayed prices, against the cash with which the student started. */
export interface PortfolioValuation {
  cash: Rupiah;
  startingCash: Rupiah;
  /** Each holding in the order of the portfolio, which is by code. */
  holdings: ValuedHolding[];
  /** The codes of the holdings without a price, in the order of the portfolio. */
  unpricedCodes: string[];
  /** The value of the holdings, the cash with them, and the return of that total since the starting cash, or undefined while a holding has no price. */
  total:
    | { holdingsValue: Rupiah; value: Rupiah; return: CumulativeReturn }
    | undefined;
}

/** Values the cash and the holdings of a portfolio at the latest delayed quotes of their stocks, by code. */
export function valuePortfolio(
  portfolio: { cash: Rupiah; holdings: readonly Holding[] },
  startingCash: Rupiah,
  quotes: ReadonlyMap<string, StockQuote>,
): PortfolioValuation {
  const holdings: ValuedHolding[] = [];
  const unpricedCodes: string[] = [];
  let holdingsValue = 0;
  for (const holding of portfolio.holdings) {
    const quote = quotes.get(holding.code);
    if (quote === undefined) {
      holdings.push({ ...holding, kind: "unpriced" });
      unpricedCodes.push(holding.code);
      continue;
    }
    const value = rupiah(holding.shares * quote.price);
    const gain = rupiah(value - holding.cost);
    holdings.push({
      ...holding,
      kind: "priced",
      quote,
      value,
      gain,
      gainReturn: cumulativeReturn(priceChange(value, holding.cost)),
    });
    holdingsValue += value;
  }
  const value = rupiah(portfolio.cash + holdingsValue);
  return {
    cash: portfolio.cash,
    startingCash,
    holdings,
    unpricedCodes,
    total:
      unpricedCodes.length > 0
        ? undefined
        : {
            holdingsValue: rupiah(holdingsValue),
            value,
            return: cumulativeReturn(priceChange(value, startingCash)),
          },
  };
}
