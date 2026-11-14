import { renderInRouterForTest } from "~/render-in-router-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { expect, test } from "vitest";
import chartStyles from "~/charts/time-chart.module.css";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { IhsgCard } from "./ihsg-card";
import { fixtureHistory } from "./fixture-history";
import { defaultMarketFilters } from "./market-filters";
import { marketIndex } from "./tracked-instruments";

const texts: Record<Locale, { mark: string; noPrice: string }> = {
  id: { mark: "5.270,00", noPrice: "Portolab belum memiliki harga IHSG." },
  en: { mark: "5,270.00", noPrice: "Portolab has no price for IHSG yet." },
};
for (const locale of locales) {
  test(`draws rising, falling, and single-close ranges with an area and index marks on the right in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const history = fixtureHistory(marketIndex, "2026-10-26");
    if (history?.kind !== "index")
      throw new Error("The recorded IHSG history is missing.");
    const cases = [
      { closes: history.closes, direction: "fall", area: true },
      { closes: history.closes.slice(1, 3), direction: "rise", area: true },
      { closes: history.closes.slice(0, 1), direction: "flat", area: false },
    ] as const;
    for (const state of cases) {
      const html = renderInRouterForTest(
        <IhsgCard
          index={marketIndex.code}
          quote={undefined}
          closes={state.closes}
          filters={defaultMarketFilters}
          missed={false}
        />,
        conceptLessonDataForTest(),
      );
      expect(html).toContain(`class="${chartStyles[state.direction] ?? ""}"`);
      expect(html.includes("linearGradient")).toBe(state.area);
      expect(html).toContain('text-anchor="start"');
      expect(html).toContain(texts[locale].noPrice);
      if (state.direction === "rise")
        expect(html).toContain(texts[locale].mark);
    }
  });
}
