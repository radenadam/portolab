import { basisPointsPerWhole } from "~/units/basis-points";
import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import { roundedShare } from "./rounded-share";
import { purchaseCost, tradeCosts } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The most lots that an amount of cash pays for at a price with the broker fee, which can be 0. */
export function largestAffordableLots(
  cash: Rupiah,
  lot: { price: Rupiah; shares: Shares },
  rates: CostRates,
): Lots {
  const lotValue = lot.price * lot.shares;
  const costOf = (count: number): Rupiah => {
    const value = rupiah(count * lotValue);
    return purchaseCost({ value, fee: tradeCosts("buy", value, rates).fee });
  };
  // The rounding of the fee moves the cost of a number of lots by less than a rupiah, so the count without that rounding is at most one lot away from the answer.
  let count = roundedShare(
    cash,
    {
      numerator: basisPointsPerWhole,
      denominator: lotValue * (basisPointsPerWhole + rates.buyFee),
    },
    "down",
  );
  while (costOf(count + 1) <= cash) {
    count += 1;
  }
  while (count > 0 && costOf(count) > cash) {
    count -= 1;
  }
  return lots(count);
}
