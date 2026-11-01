import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { User } from "./account";
import { AccountDetails } from "./account-details";
import { parseUsername } from "./username";

const texts: Record<
  Locale,
  {
    nameLabel: string;
    usernameLabel: string;
    roleLabel: string;
    lecturer: string;
    student: string;
    consented: string;
  }
> = {
  id: {
    nameLabel: "Nama Anda",
    usernameLabel: "Nama pengguna",
    roleLabel: "Peran",
    lecturer: "Dosen",
    student: "Mahasiswa",
    consented:
      "Anda menyetujui pemberitahuan privasi pada 2 Nov 2026, 10.15 WIB.",
  },
  en: {
    nameLabel: "Your name",
    usernameLabel: "Username",
    roleLabel: "Role",
    lecturer: "Lecturer",
    student: "Student",
    consented: "You agreed to the privacy notice on Nov 2, 2026, 10:15 AM WIB.",
  },
};

function user(role: User["role"]): Omit<User, "id"> {
  const username = parseUsername("sari", "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  return {
    username: username.value,
    name: "Sari Wulandari",
    role,
    consentedAt: new Date("2026-11-02T03:15:00.000Z"),
  };
}

for (const locale of locales) {
  const text = texts[locale];

  test(`shows the name, the username, the role, and the time of consent of a lecturer and of a student in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const role of ["lecturer", "student"] as const) {
      const html = renderToStaticMarkup(<AccountDetails user={user(role)} />);
      expect(html).toContain(
        `<dt>${text.nameLabel}</dt><dd>Sari Wulandari</dd><dt>${text.usernameLabel}</dt><dd>sari</dd><dt>${text.roleLabel}</dt><dd>${text[role]}</dd></dl><p>${text.consented}</p>`,
      );
    }
  });
}
