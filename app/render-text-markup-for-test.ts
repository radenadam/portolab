import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function textOfMarkupForTest(markup: string): string {
  return markup.replaceAll(/<[^>]+>/gu, "");
}

/** Text assertions keep the complete sentence readable while number-text.test.tsx and the browser layout tests check the spans that keep its numbers together. */
export function renderTextMarkupForTest(part: ReactNode): string {
  const numberSpans: boolean[] = [];
  return renderToStaticMarkup(part).replaceAll(/<\/?span\b[^>]*>/gu, (tag) => {
    if (tag.startsWith("</")) return numberSpans.pop() === true ? "" : tag;
    const isNumber =
      tag.includes('data-number=""') ||
      tag.includes('data-number-text=""') ||
      tag.includes('data-text-value=""');
    numberSpans.push(isNumber);
    return isNumber ? "" : tag;
  });
}
