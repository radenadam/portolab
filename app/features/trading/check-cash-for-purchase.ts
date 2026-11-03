import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { OrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import type { CashShortfall } from "./order";
import { purchaseCost, tradeCosts } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** A purchase of the shares of an order at a price. */
interface Purchase {
  code: string;
  lots: OrderLots;
  shares: Shares;
  price: Rupiah;
}

/** Checks that the cash that a purchase can use pays for its value and its broker fee, and gives both. The failure gives the amounts of the purchase and the cash. */
export function checkCashForPurchase(
  purchase: Purchase,
  availableCash: Rupiah,
  rates: CostRates,
): Result<{ value: Rupiah; fee: Rupiah }, CashShortfall> {
  const value = rupiah(purchase.price * purchase.shares);
  const { fee } = tradeCosts("buy", value, rates);
  if (purchaseCost({ value, fee }) <= availableCash) {
    return succeed({ value, fee });
  }
  return fail({
    code: purchase.code,
    lots: purchase.lots,
    price: purchase.price,
    value,
    fee,
    availableCash,
  });
}
