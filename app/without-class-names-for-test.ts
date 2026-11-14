/** The markup of a part without its classes, because the names of the classes of CSS modules carry a hash, so a test reads the rest of the markup as it is. */
export function withoutClassNamesForTest(html: string): string {
  return html.replaceAll(/ class="[^"]*"/g, "");
}
