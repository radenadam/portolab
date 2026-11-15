import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { largestAffordableCount } from "./largest-affordable-count";
import type { OrderSide } from "./order";
import type { OrderTradingDay } from "./order-trading-day";

export type TicketFraction = 0.25 | 0.5 | 1;

/** The exchange cap applies after sizing a share of the budget, so each chip still means a share of the cash or holding. */
export function ticketQuickLots(
  side: OrderSide,
  fraction: TicketFraction,
  budget: {
    available: Rupiah;
    free: Lots;
    price: Rupiah;
    day: OrderTradingDay;
  },
): Lots {
  const { rules, rates } = budget.day;
  let count: number;
  switch (side) {
    case "buy":
      count = largestAffordableCount(
        rupiah(Math.floor(budget.available * fraction)),
        rupiah(budget.price * rules.lotShares),
        rates,
      );
      break;
    case "sell":
      count = Math.floor(budget.free * fraction);
      break;
  }
  return lots(Math.min(rules.maximumLots, count));
}
