import { parseFilledText } from "~/form-text";
import { digitGroupSeparator, formatNumber, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { defaultStartingCash, startingCashLimits } from "./class-rules";

/** Reads the starting cash of a class as a lecturer writes it, in whole rupiah, as digits alone or with the separators of digit groups where the active language writes them. */
export function parseStartingCash(
  value: unknown,
  source: string,
): Result<Rupiah, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const written = text.value.trim();
  const separator = digitGroupSeparator();
  const digits = written.replaceAll(separator, "");
  // Removing a separator from where Intl writes none, such as the decimal mark of the other language, would change the amount without any error, so such a text fails. A bigint keeps every digit of an amount above the limits, so such an amount fails on its range instead.
  if (
    !/^\d+$/.test(digits) ||
    (written !== digits && written !== formatNumber(BigInt(digits)))
  ) {
    return fail(
      m.classes_starting_cash_error({
        field: source,
        value: written,
        example: formatNumber(defaultStartingCash),
        separator,
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
        value: written,
        minimum: formatRupiah(startingCashLimits.minimum),
        maximum: formatRupiah(startingCashLimits.maximum),
      }),
    );
  }
  return succeed(amount);
}
