import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { HomeOnboarding } from "./home-onboarding";
import { HomeOnboardingVisual } from "./home-onboarding-visual";
import { homeWelcomeForTest } from "./home-welcome-for-test";
import { homeWelcomeTextsForTest } from "./home-welcome-texts-for-test";
import { onboardingSteps } from "./onboarding";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { rupiah } from "~/units/rupiah";
import { readHomeWelcome } from "./read-home-welcome.server";
import { parseHomeSummaryTime } from "./parse-home-summary-time";
import { HomeSinceCard } from "./home-since-card";
import { m } from "~/paraglide/messages.js";

const classId = 7 as ClassId;
for (const locale of locales) {
  test(`keeps a source failure and a summary action error visible inside the introduction in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const database = openDatabaseForTest();
    const startingCash = rupiah(125_000_000);
    const now = new Date("2026-10-30T10:00:00Z");
    const welcome = readHomeWelcome(database, {
      portfolio: { cash: startingCash, holdings: [], orders: [] },
      startingCash,
      now,
    });
    expect(welcome).toBeDefined();
    if (welcome === undefined)
      throw new Error("The empty portfolio has no welcome.");
    expect(welcome.riskFree.ok).toBe(false);
    if (welcome.riskFree.ok)
      throw new Error("An empty price database has a measured market rate.");
    const refusal = parseHomeSummaryTime(
      "bad",
      m.trading_home_since_visit_title(),
      { joinedAt: now, now },
    );
    expect(refusal.ok).toBe(false);
    if (refusal.ok) throw new Error("The malformed summary time was accepted.");
    const notice = (
      <HomeSinceCard
        classId={classId}
        orders={[]}
        now={now}
        failure={refusal.failure}
      />
    );
    const html = renderMarkupForTest(
      <HomeOnboarding
        classId={classId}
        welcome={welcome}
        delayMinutes={10}
        step="help"
        notice={notice}
      />,
    );
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain(markupTextForTest(welcome.riskFree.failure));
    expect(text).toContain(markupTextForTest(refusal.failure));
    expect(html).toContain('role="alert"');
  });
  test(`shows every introduction stage with the class cash, a hypothetical impact, and the stored rate in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const expected = homeWelcomeTextsForTest[locale];
    const { home, welcome } = await homeWelcomeForTest();
    expect(welcome.riskFree.ok).toBe(true);
    for (const [index, step] of onboardingSteps.entries()) {
      const html = renderMarkupForTest(
        <HomeOnboarding
          classId={classId}
          welcome={welcome}
          delayMinutes={home.delayMinutes}
          step={step}
        />,
      );
      const text = html.replace(/<[^>]+>/g, "");
      for (const value of [expected.skip, expected.progress[step]])
        expect(text).toContain(markupTextForTest(value));
      expect(html).toContain(`aria-label="${expected.navigation}"`);
      expect(html).toContain('href="/classes/7#home-welcome-onboarding"');
      if (index > 0) expect(text).toContain(expected.back);
      switch (step) {
        case "cash":
          for (const value of [
            expected.cashTitle,
            expected.body,
            expected.startingCash,
            expected.cash,
            expected.history,
            expected.next,
          ])
            expect(text).toContain(markupTextForTest(value));
          expect(html).toContain('href="/classes/7?welcome=impact"');
          break;
        case "impact":
          for (const value of [
            expected.impactTitle,
            expected.impactBody,
            expected.example,
            expected.next,
            ...expected.impactRows,
          ])
            expect(text).toContain(markupTextForTest(value));
          expect(html).toContain('href="/classes/7?welcome=cash"');
          expect(html).toContain('href="/classes/7?welcome=help"');
          break;
        case "help":
          for (const value of [
            expected.helpTitle,
            expected.helpBody,
            expected.beta,
            expected.ownNumber,
            expected.riskFree,
            expected.start,
          ])
            expect(text).toContain(markupTextForTest(value));
          expect(html).toContain('href="/classes/7?welcome=impact"');
          expect(html).toContain("SLOPE");
          break;
      }
    }
  });
  test(`explains zero or one recent close after stored history is deleted in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const expected = homeWelcomeTextsForTest[locale];
    for (const count of [0, 1] as const) {
      const { home, welcome } = await homeWelcomeForTest(false, 0, count);
      expect(welcome.indexHistory.values).toHaveLength(count);
      const html = renderMarkupForTest(
        <HomeOnboardingVisual
          step="cash"
          welcome={welcome}
          delayMinutes={home.delayMinutes}
        />,
      );
      expect(html.replace(/<[^>]+>/g, "")).toContain(
        markupTextForTest(
          count === 0 ? expected.zeroCloses : expected.oneClose,
        ),
      );
    }
  });
}
