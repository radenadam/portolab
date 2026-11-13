import type { OrderSide, Trade } from "~/features/trading/order";
import {
  cashChange,
  purchaseCost,
  tradeWithCosts,
} from "~/features/trading/trading-costs";
import type { CostRates } from "~/features/trading/trading-costs";
import { fail, succeed } from "~/result";
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

/** A trade that a student considers before placing its order. */
export interface ConsideredTrade {
  code: string;
  side: OrderSide;
  /** The shares that the trade buys or sells. */
  shares: Shares;
  /** The price at which the trade would fill, which sets its value and its costs. */
  price: Rupiah;
  /** The rates of the costs on the trading day of the trade, which costRatesOn gives. */
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

/** Why a trade has no impact to measure: a purchase that costs more than the cash of the portfolio, a sale of more shares than the portfolio holds, or closes that give no measures. */
export type TradeImpactFailure =
  | MeasureFailure
  | { kind: "costsMoreThanCash"; cost: Rupiah; cash: Rupiah }
  | { kind: "sellsMoreThanHeld"; shares: Shares; heldShares: Shares };

/** Measures a portfolio before and after a trade. The stocks of the portfolio include the stock of the trade, with no shares when the portfolio does not hold it. Every share is valued at the latest delayed price of its stock, before and after the trade, and the cash after the trade changes by the value of the trade at its own price and by its costs. */
export function measureTrade(
  portfolio: { stocks: readonly HeldStock[]; cash: Rupiah },
  trade: ConsideredTrade,
  against: Against,
): Result<TradeImpact, TradeImpactFailure> {
  const traded = portfolio.stocks.find((stock) => stock.code === trade.code);
  if (traded === undefined) {
    throw new Error(
      `measureTrade takes the stock of the trade among the stocks of the portfolio, but ${trade.code} is not among them.`,
    );
  }
  const costs = tradeWithCosts(
    trade.side,
    rupiah(trade.shares * trade.price),
    trade.rates,
  );
  const sharesAfter = sharesAfterTrade(trade, costs, {
    heldShares: traded.shares,
    cash: portfolio.cash,
  });
  if (!sharesAfter.ok) {
    return sharesAfter;
  }
  const cashAfter = rupiah(portfolio.cash + cashChange(trade.side, costs));
  const before = measureStocks(portfolio.stocks, portfolio.cash, against);
  if (!before.ok) {
    return before;
  }
  const after = measureStocks(
    portfolio.stocks.map((stock) =>
      stock === traded ? { ...stock, shares: sharesAfter.value } : stock,
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

/** The shares of the stock of a trade that the portfolio holds after it, or why the portfolio cannot make it: a purchase needs the cash for its value and its costs, and a sale needs the shares that it sells. */
function sharesAfterTrade(
  trade: ConsideredTrade,
  costs: Trade,
  portfolio: { heldShares: Shares; cash: Rupiah },
): Result<Shares, TradeImpactFailure> {
  const { heldShares, cash } = portfolio;
  switch (trade.side) {
    case "buy": {
      const cost = purchaseCost(costs);
      return cost > cash
        ? fail({ kind: "costsMoreThanCash", cost, cash })
        : succeed(toShares(heldShares + trade.shares));
    }
    case "sell":
      return trade.shares > heldShares
        ? fail({ kind: "sellsMoreThanHeld", shares: trade.shares, heldShares })
        : succeed(toShares(heldShares - trade.shares));
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
