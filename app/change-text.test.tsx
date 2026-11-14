import { expect, test } from "vitest";
import { ChangeText } from "./change-text";
import { formatSignedPercent } from "./formatting";
import { renderMarkupForTest } from "./render-markup-for-test";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";

const changes: Record<Locale, readonly string[]> = {
  id: ["+1,00%", "-1,00%", "0,00%"],
  en: ["+1.00%", "-1.00%", "0.00%"],
};

for (const locale of locales) {
  test(`uses the rounded sign for the ink and arrow, including a negative return that rounds to zero, in ${locale}`, () => {
    switchLocaleForTest(locale);
    for (const [index, [value, direction, arrow]] of (
      [
        [0.01, "rise", "▲"],
        [-0.01, "fall", "▼"],
        [-0.00001, "none", undefined],
      ] as const
    ).entries()) {
      const html = renderMarkupForTest(
        <ChangeText colored change={formatSignedPercent(value)} />,
      );
      expect(html).toContain(`data-change="${direction}"`);
      expect(html).toContain(changes[locale][index]);
      expect(html.includes('aria-hidden="true"')).toBe(arrow !== undefined);
    }
  });
}
