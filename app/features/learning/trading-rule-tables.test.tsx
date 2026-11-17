import { rupiah } from "~/units/rupiah";
import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { textOfMarkupForTest } from "~/text-of-markup-for-test";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { TickTable, BandTable } from "./trading-rule-tables";

const texts: Record<
  Locale,
  { low: string; middle: string; highest: string; special: string }
> = {
  id: {
    low: "Rp 1 sampai di bawah Rp 200",
    middle: "Rp 2.000 sampai di bawah Rp 5.000",
    highest: "Rp 5.000 ke atas",
    special: "Rp 11 sampai Rp 14",
  },
  en: {
    low: "IDR 1 to below IDR 200",
    middle: "IDR 2,000 to below IDR 5,000",
    highest: "IDR 5,000 and above",
    special: "IDR 11 to IDR 14",
  },
};

for (const locale of locales) {
  test(`renders tick and rejection tables from each dated rule in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [date, fall, rows] of [
      ["2026-09-28", "−15%", 4],
      ["2026-10-19", "−7%", 4],
      ["2026-10-20", "−7%", 5],
    ] as const) {
      const rules = successValueForTest(
        idxRulesOn(date),
        "Dated trading rules",
      );
      expect(rules.autoRejectionBands).toHaveLength(rows);
      const ticks = renderMarkupForTest(
        <TickTable rules={rules} highlight={rupiah(5000)} />,
      );
      const band = renderMarkupForTest(<BandTable rules={rules} />);
      expect(ticks.match(/<tr\b/gu)).toHaveLength(rules.tickBands.length + 1);
      expect(band.match(/<tr\b/gu)).toHaveLength(rows + 1);
      expect(ticks.match(/data-selected="true"/gu)).toHaveLength(1);
      for (const expected of [
        texts[locale].low,
        texts[locale].middle,
        texts[locale].highest,
      ])
        expect(textOfMarkupForTest(ticks)).toContain(expected);
      expect(textOfMarkupForTest(band)).toContain(fall);
      expect(textOfMarkupForTest(band).includes(texts[locale].special)).toBe(
        date === "2026-10-20",
      );
    }
  });
}
