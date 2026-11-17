import type { Rupiah } from "~/units/rupiah";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { smallestOrderLots } from "~/units/lots";
import type { OrderTradingDay } from "./order-trading-day";
import { ticketAmounts } from "./ticket-amounts";

export function lotAmounts(
  price: Rupiah,
  day: Pick<OrderTradingDay, "rules" | "rates">,
) {
  const quantity = shares(day.rules.lotShares * smallestOrderLots);
  const input = {
    price,
    shares: quantity,
    rates: day.rates,
    available: rupiah(0),
  };
  return {
    shares: quantity,
    buy: ticketAmounts("buy", input),
    sell: ticketAmounts("sell", input),
  };
}
