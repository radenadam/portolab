import { parseFilledText } from "~/form-text";
import { digitGrouping, formatNumber, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import { writtenWholeNumberDigits } from "~/written-whole-number-digits";
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
  const digits = writtenWholeNumberDigits(written);
  if (digits === undefined) {
    return fail(
      m.classes_starting_cash_error({
        field: source,
        value: written,
        example: formatNumber(defaultStartingCash),
        separator: digitGrouping().separator,
      }),
    );
  }
  // A JavaScript number holds only so many digits exactly, so the parser counts the digits before it reads the amount. An amount with more digits than the maximum is above it.
  const isAboveMaximum =
    digits.replace(/^0+/, "").length >
    String(startingCashLimits.maximum).length;
  const amount = Number(digits);
  if (
    isAboveMaximum ||
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
