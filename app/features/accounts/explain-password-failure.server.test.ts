import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { explainPasswordFailure } from "./explain-password-failure.server";

// 10.15 WIB on Monday 2 November 2026.
const until = new Date("2026-11-02T03:15:00.000Z");

const texts: Record<
  Locale,
  { usernameBlocked: string; addressBlocked: string }
> = {
  id: {
    usernameBlocked:
      'Portolab memblokir kata sandi untuk "dosen" sampai 10.15 WIB, karena menerima 10 kata sandi salah untuknya dalam 15 menit. Blokir ini menghentikan siapa pun yang mencoba menebak kata sandinya. Coba lagi setelah waktu tersebut.',
    addressBlocked:
      "Portolab memblokir kata sandi dari jaringan Anda sampai 10.15 WIB, karena menerima 100 kata sandi salah dari jaringan itu dalam 15 menit. Blokir ini menghentikan siapa pun yang mencoba menebak kata sandi. Coba lagi setelah waktu tersebut.",
  },
  en: {
    usernameBlocked:
      'Portolab blocks passwords for "dosen" until 10:15 AM WIB, because it received 10 wrong passwords for it within 15 minutes. The block stops anyone who tries to guess the password. Try again after that time.',
    addressBlocked:
      "Portolab blocks passwords from your network until 10:15 AM WIB, because it received 100 wrong passwords from it within 15 minutes. The block stops anyone who tries to guess passwords. Try again after that time.",
  },
};

const wrongPassword = ({
  failures,
  minutes,
}: {
  failures: string;
  minutes: string;
}): string => `Wrong, ${failures} in ${minutes}.`;

test("gives the message of its caller for a wrong password, with the limit of a username", () => {
  expect(
    explainPasswordFailure({ kind: "wrongPassword" }, "dosen", wrongPassword),
  ).toEqual({ text: "Wrong, 10 in 15.", status: 400 });
});

for (const locale of locales) {
  const text = texts[locale];

  test(`explains a block of a username and of an address with its end and its limit in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      explainPasswordFailure(
        { kind: "usernameBlocked", until },
        "dosen",
        wrongPassword,
      ),
    ).toEqual({ text: text.usernameBlocked, status: 429 });
    expect(
      explainPasswordFailure(
        { kind: "addressBlocked", until },
        "dosen",
        wrongPassword,
      ),
    ).toEqual({ text: text.addressBlocked, status: 429 });
  });
}
