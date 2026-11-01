import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isOrderLots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";
import { typeName } from "~/value-shapes";

/** Reads the number of lots that the order form sent, which is a whole number of at least 1 written in digits, such as "5". The failure is a message for the reader in the current language. */
export function parseOrderLots(
  value: unknown,
  source: string,
): Result<OrderLots, string> {
  if (typeof value === "string") {
    const text = value.trim();
    const count = Number(text);
    if (/^\d+$/.test(text) && isOrderLots(count)) {
      return succeed(count);
    }
    return fail(m.trading_lots_not_whole_error({ field: source, value }));
  }
  if (value === null || value === undefined) {
    return fail(m.trading_lots_missing_error({ field: source }));
  }
  return fail(
    m.trading_lots_not_text_error({ field: source, type: typeName(value) }),
  );
}
