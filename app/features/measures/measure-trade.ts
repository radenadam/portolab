import type { Order, Trade } from "~/features/trading/order";
import { cashChange, tradeWithCosts } from "~/features/trading/trading-costs";
import type { CostRates } from "~/features/trading/trading-costs";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares as toShares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { InstrumentCloses } from "./aligned-returns";
import type { EstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { measureValuedPortfolio } from "./measure-valued-portfolio";
import type { ValuedPortfolioMeasures } from "./measure-valued-portfolio";

/** A stock with its closes, the shares of it that a portfolio holds, and its latest delayed price, which values those shares. */
export interface HeldStock extends InstrumentCloses {
  shares: Shares;
  price: Rupiah;
}

/** A trade that a student considers: an order that placeOrder accepted, so the portfolio holds the shares that it sells and the cash that its other open orders leave pays for what it buys, and the rates of the costs of the trading day of the order, which costRatesOn gives. */
export interface ConsideredTrade {
  order: Pick<Order, "code" | "side" | "shares" | "checkedPrice">;
  rates: CostRates;
}

/** The closes of the market that the measures compare a portfolio with, and the settings that choose the months of its returns. */
interface Against {
  market: InstrumentCloses;
  settings: EstimationSettings;
}

/** What a trade does to a portfolio: the trade with its costs, the cash of the portfolio after it, and the measures of the portfolio before and after it. Both measures use the months in which the IHSG, every stock of the portfolio, and the stock of the trade have a return, as decision 0013 sets for a portfolio and all its stocks, so they differ only by the trade. */
export interface TradeImpact {
  trade: Trade;
  cashAfter: Rupiah;
  before: ValuedPortfolioMeasures;
  after: ValuedPortfolioMeasures;
}

/** Measures a portfolio before and after a trade. The stocks of the portfolio include the stock of the trade, with no shares when the portfolio does not hold it. Every share is valued at the latest delayed price of its stock, before and after the trade, and the cash after the trade changes by the value of the order at its checked price and by its costs. */
export function measureTrade(
  portfolio: { stocks: readonly HeldStock[]; cash: Rupiah },
  trade: ConsideredTrade,
  against: Against,
): Result<TradeImpact, MeasureFailure> {
  const { order, rates } = trade;
  const traded = portfolio.stocks.find((stock) => stock.code === order.code);
  if (traded === undefined) {
    throw new Error(
      `measureTrade takes the stock of the trade among the stocks of the portfolio, but ${order.code} is not among them.`,
    );
  }
  const costs = tradeWithCosts(
    order.side,
    rupiah(order.shares * order.checkedPrice),
    rates,
  );
  const cashAfter = rupiah(portfolio.cash + cashChange(order.side, costs));
  const before = measureStocks(portfolio.stocks, portfolio.cash, against);
  if (!before.ok) {
    return before;
  }
  const after = measureStocks(
    portfolio.stocks.map((stock) =>
      stock === traded
        ? { ...stock, shares: sharesAfterOrder(order, stock.shares) }
        : stock,
    ),
    cashAfter,
    against,
  );
  if (!after.ok) {
    return after;
  }
  return succeed({
    trade: costs,
    cashAfter,
    before: before.value,
    after: after.value,
  });
}

// placeOrder accepts a sale only of shares that the portfolio holds, so a sale never leaves fewer than none.
function sharesAfterOrder(
  order: ConsideredTrade["order"],
  heldShares: Shares,
): Shares {
  switch (order.side) {
    case "buy":
      return toShares(heldShares + order.shares);
    case "sell":
      return toShares(heldShares - order.shares);
  }
}

function measureStocks(
  stocks: readonly HeldStock[],
  cash: Rupiah,
  against: Against,
): Result<ValuedPortfolioMeasures, MeasureFailure> {
  return measureValuedPortfolio(
    {
      holdings: stocks.map((stock) => ({
        code: stock.code,
        closes: stock.closes,
        value: rupiah(stock.shares * stock.price),
      })),
      cash,
    },
    against.market,
    against.settings,
  );
}
