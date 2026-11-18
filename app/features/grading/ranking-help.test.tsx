import { expect, test } from "vitest";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  portfolioAgainstMarketForTest,
  portfolioWithoutVariationForTest,
  negativeTreynorTextForTest,
} from "~/features/measures/portfolio-against-market-for-test";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { textCell } from "~/workbook/workbook-cells";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { classRankingForTest } from "./class-ranking-for-test.server";
import { comparedMeasures } from "./compared-measures";
import { orderStudents } from "./order-students";
import { portfoliosWorksheet } from "./portfolios-worksheet";
import { RankingHelp } from "./ranking-help";
import { rankingMeasures } from "./ranking-measure";

const texts: Record<
  Locale,
  { labels: readonly string[]; riskFreeRate: string }
> = {
  id: {
    riskFreeRate: "0,48%",
    labels: [
      "Alpha Jensen",
      "Sharpe",
      "Treynor",
      "Rasio Sharpe membagi imbal hasil di atas tingkat bebas risiko dengan simpangan baku portofolio.",
      "Rasio Treynor membagi imbal hasil di atas tingkat bebas risiko dengan beta portofolio.",
    ],
  },
  en: {
    riskFreeRate: "0.48%",
    labels: [
      "Jensen's alpha",
      "Sharpe",
      "Treynor",
      "The Sharpe ratio divides the return above the risk-free rate by the standard deviation of the portfolio.",
      "The Treynor ratio divides the return above the risk-free rate by the beta of the portfolio.",
    ],
  },
};

for (const locale of locales) {
  test(`opens each ranking concept with the selected student's calculation and sorts an unavailable ratio after valid ones in joining order in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { taughtClass, portfolios, now } = await classRankingForTest();
    const student = portfolios.ranked.find(
      (member) => member.username === "eko",
    );
    if (student === undefined)
      throw new Error("The fixture has ranked students.");
    const cards = rankingMeasures
      .map((measure) =>
        renderInRouterForTest(
          <RankingHelp student={student} measure={measure} />,
          conceptLessonDataForTest(),
        ),
      )
      .join("");
    for (const text of texts[locale].labels)
      expect(cards).toContain(markupTextForTest(text));
    expect(cards).toContain('popover="auto"');
    expect(cards).toContain(texts[locale].riskFreeRate);
    for (const { report, ranking } of [
      { report: portfolioAgainstMarketForTest(), ranking: "treynor" as const },
      {
        report: portfolioWithoutVariationForTest(),
        ranking: "sharpe" as const,
      },
    ]) {
      if (report.kind !== "measured")
        throw new Error("The invented stocks have measures.");
      const summary = successValueForTest(
        report.measures,
        "The invented stocks have complete returns",
      );
      const replacement = { ...student, measures: comparedMeasures(summary) };
      const changed = {
        ...portfolios,
        ranked: [
          replacement,
          ...portfolios.ranked.filter(
            (member) => member.studentId !== student.studentId,
          ),
        ],
      };
      expect(
        orderStudents(changed, ranking).map((item) => item.username),
      ).toEqual(["sari", "fajar", "eko", "dewi", "budi", "rina"]);
      const sheet = portfoliosWorksheet({
        className: taughtClass.name,
        portfolios: changed,
        now,
        source: { name: "Yahoo Finance", delayMinutes: 10 },
        ranking,
      });
      const row = sheet.rows[6];
      expect(row?.[0]).toEqual(textCell("Eko Prasetyo"));
      const cell = row?.[ranking === "treynor" ? 5 : 4];
      expect(cell).toBeUndefined();
      const reason = row?.[ranking === "treynor" ? 13 : 12];
      expect(reason?.kind).toBe("text");
      if (ranking === "treynor")
        expect(reason).toEqual(textCell(negativeTreynorTextForTest[locale]));
    }
  });
}
