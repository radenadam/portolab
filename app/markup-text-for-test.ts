/** A text as React writes it inside an element, with each character that HTML reserves written as its reference, such as an apostrophe as a numeric reference. */
export function markupTextForTest(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}
