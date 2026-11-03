import { parseFilledText } from "~/form-text";
import { digitGroupSeparator, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots, smallestOrderLots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";

/** Reads the number of lots that the order form sent, which is a whole number of at least the smallest order. It is written in digits, either alone, such as "5000", or in groups of three as formatNumber writes it in the active language, such as "5.000" in Bahasa Indonesia. placeOrder checks it against the largest order of the trading day. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
): Result<OrderLots, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const digits = digitsOf(text.value.trim());
  const count = digits === undefined ? undefined : Number(digits);
  if (count !== undefined && !Number.isSafeInteger(count)) {
    return fail(
      m.trading_lots_beyond_count_error({
        field: source,
        value: text.value,
        limit: formatNumber(Number.MAX_SAFE_INTEGER),
      }),
    );
  }
  if (count === undefined || !isOrderLots(count)) {
    return fail(
      m.trading_lots_not_whole_error({
        field: source,
        value: text.value,
        minimum: formatNumber(smallestOrderLots),
        example: formatNumber(1_000),
      }),
    );
  }
  return succeed(count);
}

/** The digits of a whole number that is written in digits alone or in groups of three with the separator of the active language, or undefined for any other text. */
function digitsOf(written: string): string | undefined {
  const groups = written.split(digitGroupSeparator());
  for (const [index, group] of groups.entries()) {
    const isDigits = /^\d+$/.test(group);
    const fitsGroups =
      groups.length === 1 ||
      (index === 0 ? group.length <= 3 : group.length === 3);
    if (!isDigits || !fitsGroups) {
      return undefined;
    }
  }
  return groups.join("");
}
