import { englishFormatting } from "~/english-formatting";
import type { OrderFailure } from "./order";
import { purchaseCost } from "./trading-costs";

/** Operators need the missing record's original reason and recipe corrections, because the sample command has no order form. */
export function sampleOrderFailureText(failure: OrderFailure): string {
  if ("reason" in failure) return failure.reason;
  switch (failure.kind) {
    case "noPrice":
      return `No quote of ${failure.code} is stored. Update quotes before running the sample command again.`;
    case "outsideUniverse":
      return `${failure.code} is outside the LQ45 on ${englishFormatting.date(failure.date)}. Choose a stock in the recorded universe for that day.`;
    case "noPriceHistory":
      return `${failure.instrument} has no complete month of stored closes for the order of ${failure.code}. Update price history before running the sample command again.`;
    case "tooFewReturns":
      return `${failure.code} has a monthly return count of ${englishFormatting.number(failure.count)}, but purchases need at least ${englishFormatting.number(failure.minimum)}. Choose a stock with enough stored monthly returns.`;
    case "noReferenceClose":
      return `The reference close of ${failure.code} on ${englishFormatting.date(failure.date)} is missing. Update price history before running the sample command again.`;
    case "outsideLimits":
      return `The price of ${failure.code} must be from ${englishFormatting.rupiah(failure.lowest)} to ${englishFormatting.rupiah(failure.highest)} on ${englishFormatting.date(failure.date)}, with a reference close of ${englishFormatting.rupiah(failure.reference)}. Choose a price within those limits.`;
    case "offTick":
      return `The price must follow a tick size of ${englishFormatting.rupiah(failure.tick)}. Choose ${englishFormatting.rupiah(failure.below)} or ${englishFormatting.rupiah(failure.above)} instead.`;
    case "notEnoughCash":
      return `The purchase of ${failure.code} costs ${englishFormatting.rupiah(purchaseCost(failure))}, including costs, but available cash is ${englishFormatting.rupiah(failure.availableCash)}. Open purchases set aside ${englishFormatting.rupiah(failure.setAside.amount)}. The largest affordable lot count at ${englishFormatting.rupiah(failure.price)} is ${englishFormatting.number(failure.largestLots)}. Reduce or remove this purchase from the recipe.`;
    case "notEnoughShares":
      return `The sale of ${failure.code} requests a lot count of ${englishFormatting.number(failure.lots)}, but the holding has ${englishFormatting.number(failure.heldLots)} and open sales set aside ${englishFormatting.number(failure.setAside.amount)}. Remove this sale or reduce its lot count to the unreserved holding.`;
  }
}
