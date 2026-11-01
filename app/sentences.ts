/** Joins words into a list, such as "a, b, and c", or "a, b, or c" for a choice. The list is English unless the caller names another language, because the scripts write English. */
export function listOfWords(
  words: readonly string[],
  type: "conjunction" | "disjunction" = "conjunction",
  locale = "en",
): string {
  return new Intl.ListFormat(locale, { type }).format(words);
}

/** Chooses the singular form for a count of one and the plural form for any other count, whether the forms are words or the messages that hold them. */
export function singularOrPlural<Form>(
  count: number,
  singular: Form,
  plural: Form,
): Form {
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
