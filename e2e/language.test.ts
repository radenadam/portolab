import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { chooseLanguage, languages } from "./languages.ts";
import type { Language, TextsByLanguage } from "./languages.ts";

const texts: TextsByLanguage<{
  pageTitle: string;
  pageBody: string;
  rejectedTitle: string;
  unknownLanguageError: string;
}> = {
  id: {
    pageTitle: "Pilih bahasa",
    pageBody: "Pilih bahasa dengan pengalih di bagian atas halaman.",
    rejectedTitle: "Bahasa tidak dapat diganti",
    unknownLanguageError:
      'Formulir mengirim "fr" di kolom locale, tetapi Portolab hanya tersedia dalam Bahasa Indonesia dan English. Pilih salah satunya di pengalih bahasa.',
  },
  en: {
    pageTitle: "Choose a language",
    pageBody: "Choose a language with the switch at the top of the page.",
    rejectedTitle: "The language could not be changed",
    unknownLanguageError:
      'The form sent "fr" in the field locale, but Portolab is only available in Bahasa Indonesia and English. Choose one of them in the language switch.',
  },
};

// The switch offers only the languages that Portolab has, so the test changes the value of one of its buttons in the page, as a forged form would.
async function sendUnknownLanguage(
  page: Page,
  buttonName: string,
): Promise<void> {
  const button = page.getByRole("button", { name: buttonName });
  await button.evaluate((element) => {
    element.setAttribute("value", "fr");
  });
  await button.click();
}

// The language that each test switches to, after it checks the page in its own language.
const otherLanguages: Record<Language["code"], Language> = {
  id: languages[1],
  en: languages[0],
};

for (const language of languages) {
  const text = texts[language.code];
  const otherLanguage = otherLanguages[language.code];

  test(`rejects an unknown language and keeps the switch working in ${language.name}`, async ({
    page,
  }) => {
    await chooseLanguage(page, language);
    await sendUnknownLanguage(page, otherLanguage.name);
    await expect(page.locator("html")).toHaveAttribute("lang", language.code);
    await expect(page).toHaveTitle(`${text.rejectedTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.rejectedTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.unknownLanguageError)).toBeVisible();
    await expectAccessibleScreen(page);
    await page.getByRole("button", { name: otherLanguage.name }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      otherLanguage.code,
    );
  });

  test(`shows the language switch on a plain visit of the language address in ${language.name}`, async ({
    page,
  }) => {
    await chooseLanguage(page, language);
    await page.goto("/language");
    await expect(page).toHaveTitle(`${text.pageTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.pageTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.pageBody)).toBeVisible();
    await expectAccessibleScreen(page);
    await page.getByRole("button", { name: otherLanguage.name }).click();
    await expect(page).toHaveTitle(
      `${texts[otherLanguage.code].pageTitle} | Portolab`,
    );
  });
}
