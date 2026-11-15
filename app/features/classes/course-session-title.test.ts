import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { courseSessionTitle } from "./course-session-title";

const labels: Record<Locale, readonly string[]> = {
  id: ["UTS", "UAS", "Sesi 9"],
  en: ["Midterm", "Final", "Session 9"],
};
for (const locale of locales) {
  test(`names exams and ordinary sessions on the timeline in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      ([8, 16, 9] as const).map((session) =>
        courseSessionTitle(session, "short"),
      ),
    ).toEqual(labels[locale]);
  });
}
