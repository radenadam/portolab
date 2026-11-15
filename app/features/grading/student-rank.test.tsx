import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { classRankingForTest } from "./class-ranking-for-test.server";
import { orderStudents } from "./order-students";
import { StudentRank } from "./student-rank";

const texts: Record<Locale, { ranked: string; unranked: string }> = {
  id: {
    ranked: "eko · peringkat 1 dari 3",
    unranked: "rina · belum ada peringkat",
  },
  en: { ranked: "eko · rank 1 of 3", unranked: "rina · unranked" },
};

for (const locale of locales) {
  test(`keeps the username and rank in one complete message in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { portfolios } = await classRankingForTest();
    const all = orderStudents(portfolios, "alpha");
    const ranked = all.find((student) => student.username === "eko");
    const unranked = all.find((student) => student.username === "rina");
    if (ranked === undefined || unranked === undefined)
      throw new Error("The fixture needs Eko and Rina.");
    expect(
      renderTextMarkupForTest(
        <StudentRank student={ranked} all={all} measure="alpha" />,
      ),
    ).toBe(texts[locale].ranked);
    expect(
      renderTextMarkupForTest(
        <StudentRank student={unranked} all={all} measure="alpha" />,
      ),
    ).toBe(texts[locale].unranked);
  });
}
