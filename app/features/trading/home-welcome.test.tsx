import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { HomeWelcome } from "./home-welcome";
import { homeWelcomeForTest } from "./home-welcome-for-test";
import { homeWelcomeInsight } from "./home-welcome-insight";
import { homeWelcomeTextsForTest } from "./home-welcome-texts-for-test";

const classId = 7 as ClassId;
for (const locale of locales) {
  test(`welcomes an empty portfolio with class cash, a price guide, and only benchmark and classmate points in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const expected = homeWelcomeTextsForTest[locale];
    for (const peers of [0, 1, 2] as const)
      for (const available of [true, false]) {
        const { home, welcome } = await homeWelcomeForTest(available, peers);
        expect(home.report.market !== undefined).toBe(available);
        expect(home.report.valuation.holdings).toEqual([]);
        expect(home.classmates).toHaveLength(peers);
        home.view = "time";
        const html = renderMarkupForTest(
          <HomeWelcome
            home={home}
            welcome={welcome}
            classId={classId}
            firstName="12345"
          />,
          conceptLessonDataForTest(),
          "/classes/7",
        );
        const text = html.replace(/<[^>]+>/g, "");
        for (const value of [
          expected.greeting,
          expected.capital,
          expected.cash,
          expected.body,
          expected.find,
          expected.guide,
          expected.summary,
          expected.guideKind,
          expected.read,
          expected.session,
          homeWelcomeInsight(peers, available).text,
        ])
          expect(text).toContain(markupTextForTest(value));
        expect(html).toContain(`aria-label="${expected.open}"`);
        expect(html).toContain('href="/classes/7?welcome=cash"');
        expect(html).toContain('href="/classes/7/market"');
        expect(html).toContain(
          'href="/classes/7/learn/prices?returnTo=%2Fclasses%2F7%23home-price-guide"',
        );
        for (const absent of [expected.own, expected.held, expected.time])
          expect(text).not.toContain(absent);
        if (available) {
          expect(text).toContain(markupTextForTest(expected.basis));
          expect(text).toContain(markupTextForTest(expected.quote));
          expect(html).toContain(`<th scope="col">${expected.point}</th>`);
        }
      }
  });
}
