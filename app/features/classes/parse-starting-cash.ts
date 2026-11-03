import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isRupiah } from "~/units/rupiah";
import {
  hasMoreDigitsThan,
  parseWrittenWholeNumber,
} from "~/written-whole-number";
import type { Rupiah } from "~/units/rupiah";
import { defaultStartingCash, startingCashLimits } from "./class-rules";

/** Reads the starting cash of a class as a lecturer writes it, in whole rupiah, as digits alone or with the separators of digit groups where the active language writes them. */
export function parseStartingCash(
  value: unknown,
  source: string,
): Result<Rupiah, string> {
  const number = parseWrittenWholeNumber(value, source, {
    example: defaultStartingCash,
    message: m.classes_starting_cash_error,
  });
  if (!number.ok) {
    return number;
  }
  const { written, digits } = number.value;
  const amount = Number(digits);
  if (
    hasMoreDigitsThan(digits, startingCashLimits.maximum) ||
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
