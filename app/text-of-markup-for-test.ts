export function textOfMarkupForTest(markup: string): string {
  return markup.replaceAll(/<[^>]+>/gu, "");
}
