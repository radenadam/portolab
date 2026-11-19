const cardPattern =
  /<div[^>]*id="concept-[^"]*"[^>]*><div[^>]*>([\s\S]*?<\/details><p[^>]*>[^<>]*<\/p>)<\/div><\/div>/g;

/** Closed native cards remain in the markup, so their tests need a scope of their own. */
export function conceptCardBodiesForTest(markup: string): string[] {
  return Array.from(markup.matchAll(cardPattern), (match) => match[1] ?? "");
}

/** Leaves the rows for tests of their values, because the cards have tests of their own. */
export function withoutConceptCardsForTest(markup: string): string {
  // The button of a card stands in a slot that a word joiner starts, which goes with it.
  return markup
    .replaceAll(
      /(?:<span[^>]*>⁠)?<button[^>]*popoverTarget="concept-[^"]*"[^>]*>[\s\S]*?<\/button>(?:<\/span>)?/gu,
      "",
    )
    .replaceAll(cardPattern, "");
}
