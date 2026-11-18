import { expect, test } from "vitest";
import { ChangeChip } from "./change-chip";
import { formatSignedPercent } from "./formatting";
import { languageNames } from "./language-names";
import { renderMarkupForTest } from "./render-markup-for-test";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";

const chips: Record<Locale, readonly string[]> = {
  id: [
    '<span><span data-change="rise"><span aria-hidden="true">▲ </span>+0,22%</span></span>',
    '<span><span data-change="fall"><span aria-hidden="true">▼ </span>-0,96%</span></span>',
    '<span><span data-change="none">0,00%</span></span>',
  ],
  en: [
    '<span><span data-change="rise"><span aria-hidden="true">▲ </span>+0.22%</span></span>',
    '<span><span data-change="fall"><span aria-hidden="true">▼ </span>-0.96%</span></span>',
    '<span><span data-change="none">0.00%</span></span>',
  ],
};

for (const locale of locales) {
  test(`holds the change with the direction of its rounded sign, which tints the chip, including a change that rounds to zero, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [index, value] of [0.0022, -0.0096, -0.00001].entries()) {
      expect(
        renderMarkupForTest(<ChangeChip change={formatSignedPercent(value)} />),
      ).toBe(chips[locale][index]);
    }
  });
}
