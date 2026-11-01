import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { Fill, Order } from "./order";
import { roundedShare } from "./rounded-share";
import { purchaseCost } from "./trading-costs";

/** The shares of one stock that an account holds, and what they cost. */
export interface Holding {
  code: string;
  shares: Shares;
  /** What the shares cost with the broker fees of their purchases, less the cost that sales took out. */
  cost: Rupiah;
}

/** A holding after a fill, and the cost of the shares that a sale took out of it, which a purchase leaves at 0. */
export interface HoldingAfterFill {
  holding: Holding;
  soldCost: Rupiah;
}

/** The holding of the stock of an order after the order filled, by the rules of decision 0016. A purchase into a stock that the account does not hold starts from an empty holding. */
export function holdingAfterFill(
  holding: Holding | undefined,
  order: Pick<Order, "code" | "side" | "shares">,
  fill: Fill,
): HoldingAfterFill {
  switch (order.side) {
    case "buy": {
      const before = holding ?? {
        code: order.code,
        shares: shares(0),
        cost: rupiah(0),
      };
      return {
        holding: {
          code: order.code,
          shares: shares(before.shares + order.shares),
          cost: rupiah(before.cost + purchaseCost(fill)),
        },
        soldCost: rupiah(0),
      };
    }
    case "sell": {
      if (holding === undefined || holding.shares < order.shares) {
        throw new Error(
          `A sell order sets aside the shares that it sells, but the order for ${String(order.shares)} shares of ${order.code} filled against a holding of ${String(holding?.shares ?? 0)}.`,
        );
      }
      const soldCost = rupiah(
        roundedShare(
          holding.cost,
          { numerator: order.shares, denominator: holding.shares },
          "halfUp",
        ),
      );
      return {
        holding: {
          code: order.code,
          shares: shares(holding.shares - order.shares),
          cost: rupiah(holding.cost - soldCost),
        },
        soldCost,
      };
    }
  }
}
