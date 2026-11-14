/** Leaves the rows of a measure list for tests of its values. The cards have tests of their own, and a closed popover still belongs to the markup of its label. */
export function withoutConceptCardsForTest(markup: string): string {
  return markup
    .replaceAll(
      /<button[^>]*popoverTarget="concept-[^"]*"[^>]*>[\s\S]*?<\/button>/g,
      "",
    )
    .replaceAll(
      /<div[^>]*id="concept-[^"]*"[^>]*>[\s\S]*?<\/article><\/div>/g,
      "",
    );
}
