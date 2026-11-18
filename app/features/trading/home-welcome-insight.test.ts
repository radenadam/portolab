import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { homeWelcomeInsight } from "./home-welcome-insight";

const texts: Record<
  Locale,
  {
    topic: string;
    prefix: string;
    condition: string;
    endings: readonly [string, string, string];
  }
> = {
  id: {
    topic: "Portofolio",
    prefix: "Setelah order pertama terisi",
    condition: " dan syarat data peta di atas terpenuhi",
    endings: [
      ", portofolio Anda muncul di peta ini jika beta dan imbal hasilnya tersedia.",
      ", portofolio Anda muncul di peta ini, bersama teman sekelas Anda jika beta dan imbal hasilnya tersedia.",
      ", portofolio Anda muncul di peta ini, di antara teman sekelas jika beta dan imbal hasilnya tersedia.",
    ],
  },
  en: {
    topic: "Portfolio",
    prefix: "After your first order fills",
    condition: " and the map's data requirements above are met",
    endings: [
      ", your portfolio appears on this map when its beta and return are available.",
      ", your portfolio appears on this map beside your classmate when its beta and return are available.",
      ", your portfolio appears on this map among your classmates when its beta and return are available.",
    ],
  },
};

for (const locale of locales) {
  test(`explains the first portfolio among zero, one, or several classmates with and without map data in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    for (const count of [0, 1, 2] as const)
      for (const available of [true, false]) {
        expect(homeWelcomeInsight(count, available)).toEqual({
          session: 2,
          topic: text.topic,
          text:
            text.prefix +
            (available ? "" : text.condition) +
            text.endings[count],
        });
      }
  });
}
