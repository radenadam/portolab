import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { Role } from "~/features/accounts/accounts.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { ClassList } from "./class-list";

const texts: Record<Locale, Record<Role, string>> = {
  id: {
    lecturer:
      "Anda belum mengajar kelas. Buat kelas di bawah, lalu bagikan kodenya kepada mahasiswa Anda.",
    student:
      "Anda tidak berada di kelas mana pun. Gabung ke kelas dengan kode yang diberikan dosen Anda.",
  },
  en: {
    lecturer:
      "You teach no class yet. Create one below, then share its code with your students.",
    student:
      "You are in no class. Join one with the code that your lecturer gave you.",
  },
};

for (const locale of locales) {
  test(`tells a lecturer and a student without a class what each can do in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const role of ["lecturer", "student"] as const) {
      expect(renderToStaticMarkup(<ClassList role={role} classes={[]} />)).toBe(
        `<p>${texts[locale][role]}</p>`,
      );
    }
  });
}
