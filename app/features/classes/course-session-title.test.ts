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

const fullTitles: Record<Locale, readonly string[]> = {
  id: [
    "Konsep dasar manajemen portofolio",
    "Teori portofolio",
    "Nilai waktu uang",
    "Pasar modal",
    "Instrumen pasar modal",
    "Mekanisme perdagangan",
    "Review proposal penelitian",
    "Ujian tengah semester dan proposal penelitian final",
    "CAPM dan garis pasar sekuritas",
    "Imbal hasil dan risiko portofolio",
    "Forward dan futures",
    "Reksa dana",
    "Opsi",
    "Obligasi",
    "Review artikel ilmiah",
    "Ujian akhir semester dan artikel ilmiah final",
  ],
  en: [
    "Basic concepts of portfolio management",
    "Portfolio theory",
    "The time value of money",
    "The capital market",
    "Instruments of the capital market",
    "The mechanism of trading",
    "Review of the research proposal",
    "Midterm exam and the final research proposal",
    "CAPM and the security market line",
    "Portfolio return and risk",
    "Forwards and futures",
    "Mutual funds",
    "Options",
    "Bonds",
    "Review of the research article",
    "Final exam and the final research article",
  ],
};
for (const locale of locales) {
  test(`names each of the 16 sessions of the course in full in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const).map(
        (session) => courseSessionTitle(session),
      ),
    ).toEqual(fullTitles[locale]);
  });
}
