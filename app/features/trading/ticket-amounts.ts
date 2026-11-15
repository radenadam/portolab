import type { Rupiah } from "~/units/rupiah";
import { rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import type { OrderSide, Trade } from "./order";
import { cashChange, tradeWithCosts } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The estimate uses the same whole-rupiah rounding as a fill. */
export function ticketAmounts(
  side: OrderSide,
  {
    price,
    shares,
    rates,
    available,
  }: { price: Rupiah; shares: Shares; rates: CostRates; available: Rupiah },
): Trade & { total: Rupiah; after: Rupiah } {
  const trade = tradeWithCosts(side, rupiah(price * shares), rates);
  const change = cashChange(side, trade);
  return {
    ...trade,
    total: rupiah(Math.abs(change)),
    after: rupiah(available + change),
  };
}
