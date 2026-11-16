import { intlLocale } from "./intl-locale.ts";

/** How the active language groups the digits of a whole number: the character between groups, such as the dot in 100.000.000, and the number of digits in each group after the first, so that a parser can read a number as a person writes it. */
export function digitGrouping(): { separator: string; size: number } {
  const locale = intlLocale();
  // Some languages group the digits of a number only from five digits, so a million shows the groups in every language that has them.
  const million = 1_000_000;
  let separator: string | undefined;
  let lastGroup = "";
  for (const part of new Intl.NumberFormat(locale).formatToParts(million)) {
    if (part.type === "group") {
      separator = part.value;
    }
    if (part.type === "integer") {
      lastGroup = part.value;
    }
  }
  if (separator === undefined) {
    throw new Error(
      `The number format of ${locale} writes a million without a separator of digit groups.`,
    );
  }
  return { separator, size: lastGroup.length };
}
