import { basisPointsPerWhole } from "~/units/basis-points";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { roundedShare } from "./rounded-share";
import { purchaseCost, tradeCosts } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The largest whole number of units that an amount of cash pays for in one purchase with its costs, where a purchase of a number of units has that number times the value of one unit. A unit is a lot at a price for the largest order, or one rupiah of the price of 1 lot for the highest price of 1 lot. The count can be 0. */
export function largestAffordableCount(
  cash: Rupiah,
  unitValue: Rupiah,
  rates: CostRates,
): number {
  const costOf = (count: number): Rupiah => {
    const value = rupiah(count * unitValue);
    return purchaseCost({ value, ...tradeCosts("buy", value, rates) });
  };
  // The rounding of the fee moves the cost of a number of units by less than a rupiah, so the count without that rounding is at most one unit away from the answer.
  let count = roundedShare(
    cash,
    {
      numerator: basisPointsPerWhole,
      denominator: unitValue * (basisPointsPerWhole + rates.buyFee),
    },
    "down",
  );
  while (costOf(count + 1) <= cash) {
    count += 1;
  }
  while (count > 0 && costOf(count) > cash) {
    count -= 1;
  }
  return count;
}
