/** The whole text of every element of a markup and the value of every attribute, as React escapes them, so a test can require a text to fill one element instead of being part of a longer text. */
export function elementTextsForTest(markup: string): string[] {
  const texts: string[] = [];
  const open: string[] = [];
  for (const token of markup.split(/(<[^>]*>)/u)) {
    if (token.startsWith("<!--")) continue;
    if (token.startsWith("</")) {
      const text = open.pop();
      if (text === undefined)
        throw new Error(`The markup closes ${token} without opening it.`);
      texts.push(text);
      appendText(open, text);
      continue;
    }
    if (token.startsWith("<")) {
      for (const attribute of token.matchAll(/\s[\w:-]+="([^"]*)"/gu))
        texts.push(attribute[1] ?? "");
      if (!token.endsWith("/>")) open.push("");
      continue;
    }
    appendText(open, token);
  }
  if (open.length > 0)
    throw new Error(`The markup leaves ${String(open.length)} elements open.`);
  return texts;
}

function appendText(open: string[], text: string): void {
  const last = open.length - 1;
  if (last >= 0) open[last] = `${open[last] ?? ""}${text}`;
}
