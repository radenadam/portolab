import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { describeValue } from "~/value-shapes";
import { parseOptionalOrderText } from "./order-form-fields";

/** An absent preview still needs confirmation, while a malformed total cannot enter placement. */
export function parseSeenTotal(
  value: unknown,
  source: string,
): Result<Rupiah | null, string> {
  const text = parseOptionalOrderText(value, source);
  if (!text.ok) return text;
  if (text.value === undefined) return succeed(null);
  const amount = Number(text.value);
  return /^[0-9]+$/.test(text.value) && isRupiah(amount) && amount >= 0
    ? succeed(amount)
    : fail(
        m.trading_ticket_preview_invalid_error({
          source,
          value: describeValue(text.value),
        }),
      );
}
