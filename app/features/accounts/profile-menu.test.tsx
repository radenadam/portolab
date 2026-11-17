import { expect, test } from "vitest";
import { themes } from "~/features/theme/theme";
import type { Theme } from "~/features/theme/theme";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { ProfileMenu } from "./profile-menu";

const texts: Record<
  Locale,
  {
    lecturer: string;
    student: string;
    account: string;
    language: string;
    signOut: string;
    guide: string;
    theme: string;
    choices: Record<Theme, string>;
  }
> = {
  id: {
    lecturer: "Dosen",
    student: "Mahasiswa",
    account: "Akun Anda",
    language: "Bahasa",
    signOut: "Keluar",
    guide: "Panduan",
    theme: "Tema",
    choices: { system: "Sistem", light: "Terang", dark: "Gelap" },
  },
  en: {
    lecturer: "Lecturer",
    student: "Student",
    account: "Your account",
    language: "Language",
    signOut: "Sign out",
    guide: "Guide",
    theme: "Theme",
    choices: { system: "System", light: "Light", dark: "Dark" },
  },
};

// React gives the label of the language an id of its own, so the test leaves it out to read the text.
function withoutIds(html: string): string {
  return html.replaceAll(/ (id|aria-labelledby)="[^"]*"/g, "");
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`names the person and the role, and offers the account, the language, and signing out, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const [role, roleName] of [
      ["lecturer", text.lecturer],
      ["student", text.student],
    ] as const) {
      const html = withoutIds(
        renderMarkupForTest(
          <ProfileMenu name="Sari Wulandari" readerRole={role} />,
        ),
      );
      expect(html).toBe(
        [
          `<p><span>Sari Wulandari</span><span>${roleName}</span></p><hr/>`,
          `<a href="/account" data-discover="true">${text.account}</a>`,
          role === "lecturer"
            ? `<a href="/guide" data-discover="true">${text.guide}</a>`
            : "",
          `<div><form data-discover="true" action="/theme" method="post"><input type="hidden" name="returnTo" value="/"/><span>${text.theme}</span><div role="group">`,
          ...themes.map(
            (theme) =>
              `<button type="submit" value="${theme}" aria-pressed="${String(theme === "system")}" name="theme">${text.choices[theme]}</button>`,
          ),
          `</div></form></div>`,
          `<div><form data-discover="true" action="/language" method="post"><input type="hidden" name="returnTo" value="/"/><span>${text.language}</span>`,
          `<div role="group"><button type="submit" value="id" lang="id" aria-pressed="${String(locale === "id")}" name="locale">Bahasa Indonesia</button>`,
          `<button type="submit" value="en" lang="en" aria-pressed="${String(locale === "en")}" name="locale">English</button></div></form></div><hr/>`,
          `<form data-discover="true" action="/sign-out" method="post"><button type="submit">${text.signOut}</button></form>`,
        ].join(""),
      );
    }
  });
}
