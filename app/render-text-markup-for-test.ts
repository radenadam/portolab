import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Whole-sentence assertions ignore number wrappers because the renderer’s own tests check their boundaries. */
export function renderTextMarkupForTest(part: ReactNode): string {
  const numberSpans: boolean[] = [];
  return renderToStaticMarkup(part).replaceAll(/<\/?span\b[^>]*>/gu, (tag) => {
    if (tag.startsWith("</")) return numberSpans.pop() === true ? "" : tag;
    const isNumber =
      tag.includes('data-number=""') || tag.includes('data-number-text=""');
    numberSpans.push(isNumber);
    return isNumber ? "" : tag;
  });
}
