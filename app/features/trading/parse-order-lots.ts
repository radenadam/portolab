import { formatNumber } from "~/formatting";
import { parseFilledText } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots } from "~/units/lots";
import type { Lots, OrderLots } from "~/units/lots";

/** Reads the number of lots that the order form sent, which is a whole number from 1 to the largest order of IDX, written in digits, such as "5". The source is the label of the field, the largest order is the one that idxRulesOn gives for the trading day of the order, and the failure is a sentence for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
  maximumLots: Lots,
): Result<OrderLots, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const digits = text.value.trim();
  const count = Number(digits);
  if (!/^\d+$/.test(digits) || count < 1) {
    return fail(
      m.trading_lots_not_whole_error({ field: source, value: text.value }),
    );
  }
  if (count > maximumLots || !isOrderLots(count)) {
    return fail(
      m.trading_lots_too_many_error({
        field: source,
        value: text.value,
        maximum: formatNumber(maximumLots),
      }),
    );
  }
  return succeed(count);
}
