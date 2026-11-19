import { markupTextForTest } from "~/markup-text-for-test";

/** The markup of the measures of a list of measures, each a block of its name, its value, the sentence that says what its formula computes, and its formula, as MeasureList shows them without the classes of their styles. */
export function measureDefinitionsForTest(
  rows: readonly (readonly [string, string, string, string])[],
): string {
  return rows
    .map(
      ([label, value, description, formula]) =>
        `<div><dt>${markupTextForTest(label)}</dt><dd>${value}</dd><dd>${markupTextForTest(description)}</dd><dd>${formula}</dd></div>`,
    )
    .join("");
}
