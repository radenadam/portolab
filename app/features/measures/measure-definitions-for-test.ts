import { markupTextForTest } from "~/markup-text-for-test";

/** The markup of the measures of a list of measures, each a name, a value, and a formula, as MeasureList shows them without the classes of their styles. */
export function measureDefinitionsForTest(
  rows: readonly (readonly [string, string, string])[],
): string {
  return rows
    .map(
      ([label, value, formula]) =>
        `<dt>${markupTextForTest(label)}</dt><dd>${value}</dd><dd>${formula}</dd>`,
    )
    .join("");
}
