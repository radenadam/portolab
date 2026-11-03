import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots, smallestOrderLots } from "~/units/lots";
import type { Lots, OrderLots } from "~/units/lots";
import {
  hasMoreDigitsThan,
  parseWrittenWholeNumber,
} from "~/written-whole-number";
import { lotCount } from "./count-parts";

/** Reads the number of lots that the order form sent, which is a whole number from the smallest order to the largest order of the trading day that orderTradingDay gives. It is written in digits, either alone, such as "5000", or in the digit groups that formatNumber writes in the active language, such as "5.000" in Bahasa Indonesia. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
  maximumLots: Lots,
): Result<OrderLots, string> {
  const number = parseWrittenWholeNumber(value, source, {
    // The example shows a group of digits, but it must also be an order that the field accepts, so a largest order below 1,000 lots is the example instead.
    example: Math.min(1_000, maximumLots),
    message: m.trading_lots_not_whole_error,
  });
  if (!number.ok) {
    return number;
  }
  const { written, digits } = number.value;
  const count = Number(digits);
  if (hasMoreDigitsThan(digits, maximumLots) || count > maximumLots) {
    return fail(
      m.trading_lots_too_many_error({
        field: source,
        value: written,
        maximum: lotCount(maximumLots),
      }),
    );
  }
  if (!isOrderLots(count)) {
    return fail(
      m.trading_lots_too_few_error({
        field: source,
        value: written,
        minimum: lotCount(smallestOrderLots),
      }),
    );
  }
  return succeed(count);
}
