import { characterCount, parseFilledText } from "~/form-text";
import { digitGrouping, formatNumber, formatRupiah } from "~/formatting";
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
  // The longest amount that the field takes is the maximum, written with the separators of its digit groups.
  const text = parseFilledText(
    value,
    source,
    characterCount(formatNumber(startingCashLimits.maximum)),
  );
  if (!text.ok) {
    return text;
  }
  const written = text.value.trim();
  const grouping = digitGrouping();
  if (!isWrittenWholeNumber(written, grouping)) {
    return fail(
      m.classes_starting_cash_error({
        field: source,
        value: written,
        example: formatNumber(defaultStartingCash),
        separator: grouping.separator,
      }),
    );
  }
  const digits = written.replaceAll(grouping.separator, "");
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

/** Whether a text writes a whole number in digits alone, or with a separator only between the groups that the active language writes, such as 100.000.000. Removing a separator from another place, such as the decimal mark of the other language, would change the amount without any error, so the parser judges the form of a text before its amount. */
function isWrittenWholeNumber(
  text: string,
  grouping: { separator: string; size: number },
): boolean {
  const groups = text.split(grouping.separator);
  for (const [index, group] of groups.entries()) {
    // The first group holds the digits that remain after the full groups.
    const hasItsSize =
      index === 0
        ? groups.length === 1 || group.length <= grouping.size
        : group.length === grouping.size;
    if (!hasItsSize || !/^\d+$/.test(group)) {
      return false;
    }
  }
  return true;
}
