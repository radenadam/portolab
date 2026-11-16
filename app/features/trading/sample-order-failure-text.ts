import { formatCalendarDate, formatNumber, formatRupiah } from "~/formatting";
import type { OrderFailure } from "./order";
import { purchaseCost } from "./trading-costs";

/** Operators need the missing record's original reason and recipe corrections, because the sample command has no order form. */
export function sampleOrderFailureText(failure: OrderFailure): string {
  if ("reason" in failure) return failure.reason;
  switch (failure.kind) {
    case "noPrice":
      return `No quote of ${failure.code} is stored. Update quotes before running the sample command again.`;
    case "outsideUniverse":
      return `${failure.code} is outside the LQ45 on ${formatCalendarDate(failure.date)}. Choose a stock in the recorded universe for that day.`;
    case "noPriceHistory":
      return `${failure.instrument} has no complete month of stored closes for the order of ${failure.code}. Update price history before running the sample command again.`;
    case "tooFewReturns":
      return `${failure.code} has a monthly return count of ${formatNumber(failure.count)}, but purchases need at least ${formatNumber(failure.minimum)}. Choose a stock with enough stored monthly returns.`;
    case "noReferenceClose":
      return `The reference close of ${failure.code} on ${formatCalendarDate(failure.date)} is missing. Update price history before running the sample command again.`;
    case "outsideLimits":
      return `The price of ${failure.code} must be from ${formatRupiah(failure.lowest)} to ${formatRupiah(failure.highest)} on ${formatCalendarDate(failure.date)}, with a reference close of ${formatRupiah(failure.reference)}. Choose a price within those limits.`;
    case "offTick":
      return `The price must follow a tick size of ${formatRupiah(failure.tick)}. Choose ${formatRupiah(failure.below)} or ${formatRupiah(failure.above)} instead.`;
    case "notEnoughCash":
      return `The purchase of ${failure.code} costs ${formatRupiah(purchaseCost(failure))}, including costs, but available cash is ${formatRupiah(failure.availableCash)}. Open purchases set aside ${formatRupiah(failure.setAside.amount)}. The largest affordable lot count at ${formatRupiah(failure.price)} is ${formatNumber(failure.largestLots)}. Reduce or remove this purchase from the recipe.`;
    case "notEnoughShares":
      return `The sale of ${failure.code} requests a lot count of ${formatNumber(failure.lots)}, but the holding has ${formatNumber(failure.heldLots)} and open sales set aside ${formatNumber(failure.setAside.amount)}. Remove this sale or reduce its lot count to the unreserved holding.`;
  }
}
