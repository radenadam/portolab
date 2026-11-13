import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
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
  }
> = {
  id: {
    lecturer: "Dosen",
    student: "Mahasiswa",
    account: "Akun Anda",
    language: "Bahasa",
    signOut: "Keluar",
  },
  en: {
    lecturer: "Lecturer",
    student: "Student",
    account: "Your account",
    language: "Language",
    signOut: "Sign out",
  },
};

// The names of the classes of CSS modules carry a hash, and React gives the label of the language an id of its own, so the test leaves both out to read the text.
function withoutClassesAndIds(html: string): string {
  return html
    .replaceAll(/ class="[^"]*"/g, "")
    .replaceAll(/ (id|aria-labelledby)="[^"]*"/g, "");
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
      const html = withoutClassesAndIds(
        renderInRouterForTest(
          <ProfileMenu name="Sari Wulandari" readerRole={role} />,
        ),
      );
      expect(html).toBe(
        [
          `<p><span>Sari Wulandari</span><span>${roleName}</span></p><hr/>`,
          `<a href="/account" data-discover="true">${text.account}</a>`,
          `<div><form data-discover="true" action="/language" method="post"><input type="hidden" name="returnTo" value="/"/><span>${text.language}</span>`,
          `<div role="group"><button type="submit" value="id" lang="id" aria-pressed="${String(locale === "id")}" name="locale">Bahasa Indonesia</button>`,
          `<button type="submit" value="en" lang="en" aria-pressed="${String(locale === "en")}" name="locale">English</button></div></form></div><hr/>`,
          `<form data-discover="true" action="/sign-out" method="post"><button type="submit">${text.signOut}</button></form>`,
        ].join(""),
      );
    }
  });
}
