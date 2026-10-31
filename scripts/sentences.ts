/** Joins words into an English list, such as "a, b, and c". */
export function listOfWords(words: readonly string[]): string {
  return new Intl.ListFormat("en", { type: "conjunction" }).format(words);
}

/** Chooses the singular form for a count of one and the plural form for any other count. */
export function singularOrPlural(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

/** Puts a count before the singular or the plural form, such as "1 finding" or "2 findings". */
export function countOf(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${String(count)} ${singularOrPlural(count, singular, plural)}`;
}
