import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { describeValue } from "~/value-shapes";
import { parseOptionalOrderText } from "./order-form-fields";

/** A total that cannot equal a computed rupiah amount needs a new preview, not a refusal of its numeric value. */
export function parseSeenTotal(
  value: unknown,
  source: string,
): Result<Rupiah | null, string> {
  const text = parseOptionalOrderText(value, source);
  if (!text.ok) return text;
  if (text.value === undefined) return succeed(null);
  if (!/^[0-9]+$/.test(text.value))
    return fail(
      m.trading_ticket_preview_invalid_error({
        source,
        value: describeValue(text.value),
      }),
    );
  const amount = Number(text.value);
  return succeed(isRupiah(amount) ? amount : null);
}
