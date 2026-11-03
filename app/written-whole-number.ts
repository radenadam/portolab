import { parseFilledText } from "~/form-text";
import { digitGrouping, formatNumber } from "~/formatting";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";

/** A whole number as a person wrote it in a field, without the spaces around it, and its digits. */
interface WrittenWholeNumber {
  written: string;
  digits: string;
}

/** The text of the error about the form of a whole number, with the field, the value, an example of the form, and the separator of digit groups of the active language. */
type FormMessage = (inputs: {
  field: string;
  value: string;
  example: string;
  separator: string;
}) => string;

/** Reads a whole number that a person writes in a field, in digits alone, or with the separator of digit groups only between the groups that the active language writes, such as 100.000.000 in Bahasa Indonesia. Removing a separator from another place, such as the decimal mark of the other language, would change the amount without any error, so the form of the text is judged before its amount. The failure is the message of the caller about the form, with its example, or the failure of an empty field. */
export function parseWrittenWholeNumber(
  value: unknown,
  source: string,
  form: { example: number; message: FormMessage },
): Result<WrittenWholeNumber, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const written = text.value.trim();
  const grouping = digitGrouping();
  const groups = written.split(grouping.separator);
  for (const [index, group] of groups.entries()) {
    // The first group holds the digits that remain after the full groups.
    const hasItsSize =
      index === 0
        ? groups.length === 1 || group.length <= grouping.size
        : group.length === grouping.size;
    if (!hasItsSize || !/^\d+$/.test(group)) {
      return fail(
        form.message({
          field: source,
          value: written,
          example: formatNumber(form.example),
          separator: grouping.separator,
        }),
      );
    }
  }
  return succeed({ written, digits: groups.join("") });
}

/** Whether the digits of a whole number are more than the digits of a maximum, which puts the number above it. A JavaScript number holds only so many digits exactly, so a parser counts the digits before it reads the amount. */
export function hasMoreDigitsThan(digits: string, maximum: number): boolean {
  return digits.replace(/^0+/, "").length > String(maximum).length;
}
