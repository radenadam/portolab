/** Joins words into an English list, such as "a, b, and c". */
export function listOfWords(words: readonly string[]): string {
  return new Intl.ListFormat("en", { type: "conjunction" }).format(words);
}

/** Puts a count before the singular or the plural form, such as "1 finding" or "2 findings". */
export function countOf(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}
