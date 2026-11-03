import { digitGrouping } from "~/formatting";

/** The digits of a whole number that a person writes in digits alone, or with the separator of digit groups only between the groups that the active language writes, such as 100.000.000 in Bahasa Indonesia, or undefined for any other text. Removing a separator from another place, such as the decimal mark of the other language, would change the amount without any error, so a parser judges the form of a text before its amount. */
export function writtenWholeNumberDigits(text: string): string | undefined {
  const grouping = digitGrouping();
  const groups = text.split(grouping.separator);
  for (const [index, group] of groups.entries()) {
    // The first group holds the digits that remain after the full groups.
    const hasItsSize =
      index === 0
        ? groups.length === 1 || group.length <= grouping.size
        : group.length === grouping.size;
    if (!hasItsSize || !/^\d+$/.test(group)) {
      return undefined;
    }
  }
  return groups.join("");
}
