import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mathTextForTest } from "./math-text-for-test";

/** Text assertions keep the complete sentence readable while number-text.test.tsx and the browser layout tests check the spans that keep its numbers together. A formula reads as a line of notation, as mathTextForTest writes it. */
export function renderTextMarkupForTest(part: ReactNode): string {
  const numberSpans: boolean[] = [];
  return mathTextForTest(
    renderToStaticMarkup(part).replaceAll(/<\/?span\b[^>]*>/gu, (tag) => {
      if (tag.startsWith("</")) return numberSpans.pop() === true ? "" : tag;
      const isNumber =
        tag.includes('data-number=""') ||
        tag.includes('data-number-text=""') ||
        tag.includes('data-text-value=""');
      numberSpans.push(isNumber);
      return isNumber ? "" : tag;
    }),
  );
}
