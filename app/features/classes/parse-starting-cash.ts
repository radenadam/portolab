import { parseFilledText } from "~/form-text";
import { digitGroupSeparator, formatNumber, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { defaultStartingCash, startingCashLimits } from "./class-rules";

/** Reads the starting cash of a class as a lecturer writes it, in whole rupiah with or without the separators of digit groups of the active language. */
export function parseStartingCash(
  value: unknown,
  source: string,
): Result<Rupiah, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const digits = text.value
    .replaceAll(/\s/g, "")
    .replaceAll(digitGroupSeparator(), "");
  if (!/^\d+$/.test(digits)) {
    return fail(
      m.classes_starting_cash_error({
        field: source,
        value: text.value.trim(),
        example: formatNumber(defaultStartingCash),
      }),
    );
  }
  const amount = Number(digits);
  if (
    !isRupiah(amount) ||
    amount < startingCashLimits.minimum ||
    amount > startingCashLimits.maximum
  ) {
    return fail(
      m.classes_starting_cash_range_error({
        field: source,
        value: text.value.trim(),
        minimum: formatRupiah(startingCashLimits.minimum),
        maximum: formatRupiah(startingCashLimits.maximum),
      }),
    );
  }
  return succeed(amount);
}
