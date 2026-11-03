import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { OrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import type { CashShortfall, Trade } from "./order";
import { purchaseCost, tradeWithCosts } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** A purchase of the shares of an order at a price. */
interface Purchase {
  code: string;
  lots: OrderLots;
  shares: Shares;
  price: Rupiah;
}

/** Checks that the cash that a purchase can use pays for its value and its costs, and gives the trade. The failure gives the amounts of the purchase and the cash. */
export function checkCashForPurchase(
  purchase: Purchase,
  availableCash: Rupiah,
  rates: CostRates,
): Result<Trade, CashShortfall> {
  const trade = tradeWithCosts(
    "buy",
    rupiah(purchase.price * purchase.shares),
    rates,
  );
  if (purchaseCost(trade) <= availableCash) {
    return succeed(trade);
  }
  return fail({
    code: purchase.code,
    lots: purchase.lots,
    price: purchase.price,
    ...trade,
    availableCash,
  });
}
