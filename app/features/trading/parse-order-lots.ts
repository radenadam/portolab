import { parseFilledText } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";

/** Reads the number of lots that the order form sent, which is a whole number of at least 1 written in digits, such as "5". The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
): Result<OrderLots, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const digits = text.value.trim();
  const count = Number(digits);
  if (/^\d+$/.test(digits) && isOrderLots(count)) {
    return succeed(count);
  }
  return fail(
    m.trading_lots_not_whole_error({ field: source, value: text.value }),
  );
}
