import { parseFilledText } from "~/form-text";
import { digitGrouping, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots, smallestOrderLots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";
import { writtenWholeNumberDigits } from "~/written-whole-number-digits";

/** Reads the number of lots that the order form sent, which is a whole number of at least the smallest order. It is written in digits, either alone, such as "5000", or in groups of three as formatNumber writes it in the active language, such as "5.000" in Bahasa Indonesia. placeOrder checks it against the largest order of the trading day. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
): Result<OrderLots, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const written = text.value.trim();
  const digits = writtenWholeNumberDigits(written);
  const count = digits === undefined ? undefined : Number(digits);
  if (count !== undefined && !Number.isSafeInteger(count)) {
    return fail(
      m.trading_lots_beyond_count_error({
        field: source,
        value: written,
        limit: formatNumber(Number.MAX_SAFE_INTEGER),
      }),
    );
  }
  if (count === undefined || !isOrderLots(count)) {
    return fail(
      m.trading_lots_not_whole_error({
        field: source,
        value: written,
        minimum: formatNumber(smallestOrderLots),
        example: formatNumber(1_000),
        separator: digitGrouping().separator,
      }),
    );
  }
  return succeed(count);
}
