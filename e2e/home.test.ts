import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { languageNames } from "../app/language-names.ts";
import { baseLocale, locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";

const texts: Record<
  Locale,
  {
    tagline: string;
    simulationNotice: string;
    switchLabel: string;
    pricesLink: string;
    pricesTitle: string;
    notFoundTitle: string;
    notFoundBody: string;
    backHomeLink: string;
    unexpectedErrorTitle: string;
    unexpectedErrorBody: string;
  }
> = {
  id: {
    tagline:
      "Laboratorium manajemen portofolio dengan harga saham Indonesia yang nyata.",
    simulationNotice:
      "Simulasi. Tidak ada uang sungguhan dan tidak ada transaksi sungguhan.",
    switchLabel: "Bahasa",
    pricesLink: "Lihat harga saham",
    pricesTitle: "Harga saham",
    notFoundTitle: "Halaman tidak ditemukan",
    notFoundBody:
      "Alamat ini tidak ada di Portolab. Periksa kembali alamatnya, atau kembali ke beranda.",
    backHomeLink: "Kembali ke beranda",
    unexpectedErrorTitle: "Terjadi kesalahan",
    unexpectedErrorBody:
      "Portolab tidak dapat menampilkan halaman ini. Coba muat ulang halaman. Jika masalahnya berlanjut, beri tahu dosen Anda.",
  },
  en: {
    tagline: "A portfolio management lab with real Indonesian stock prices.",
    simulationNotice: "Simulation. No real money and no real trades.",
    switchLabel: "Language",
    pricesLink: "See stock prices",
    pricesTitle: "Stock prices",
    notFoundTitle: "Page not found",
    notFoundBody:
      "This address does not exist in Portolab. Check the address again, or go back to the home page.",
    backHomeLink: "Back to the home page",
    unexpectedErrorTitle: "Something went wrong",
    unexpectedErrorBody:
      "Portolab could not show this page. Try reloading the page. If the problem continues, tell your lecturer.",
  },
};

test(`opens the home page in ${languageNames[baseLocale]} for a reader who chose no language`, async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", baseLocale);
  await expect(
    page.getByText(texts[baseLocale].simulationNotice),
  ).toBeVisible();
});

for (const locale of locales.filter((other) => other !== baseLocale)) {
  test(`switches the page to ${languageNames[locale]} and back`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.getByRole("button", { name: languageNames[baseLocale] }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", baseLocale);
  });
}

for (const locale of locales) {
  const text = texts[locale];

  test(`shows the home page and its link to the prices in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await expect(page).toHaveTitle("Portolab");
    await expect(
      page.getByRole("heading", { level: 1, name: "Portolab" }),
    ).toBeVisible();
    await expect(page.getByText(text.tagline)).toBeVisible();
    await expect(page.getByText(text.simulationNotice)).toBeVisible();
    await expect(
      page.getByRole("group", { name: text.switchLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: languageNames[locale] }),
    ).toHaveAttribute("aria-pressed", "true");
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.pricesLink }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: text.pricesTitle }),
    ).toBeVisible();
  });

  test(`shows the not found page for an unknown address in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const response = await page.goto("/tidak-ada");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle(`${text.notFoundTitle} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.notFoundTitle }),
    ).toBeVisible();
    await expect(page.getByText(text.notFoundBody)).toBeVisible();
    await expect(
      page.getByRole("link", { name: text.backHomeLink }),
    ).toBeVisible();
    await expectAccessibleScreen(page);
  });

  test(`shows the page for an unexpected failure in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await failOnReturnTo(page, "/tidak-ada", text.backHomeLink);
    await expect(
      page.getByRole("heading", { level: 1, name: text.unexpectedErrorTitle }),
    ).toBeVisible();
    await expect(page).toHaveTitle(`${text.unexpectedErrorTitle} | Portolab`);
    await expect(page.getByText(text.unexpectedErrorBody)).toBeVisible();
    await expectAccessibleScreen(page);
  });
}

// The server never fails on purpose. So the reader leaves a page through its link and goes back, and the test makes the data request of that return fail, as a server that fails would.
async function failOnReturnTo(
  page: Page,
  path: string,
  linkName: string,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: linkName }).click();
  await expect(page).toHaveURL("/");
  await page.route(/\.data(\?|$)/, (route) => route.fulfill({ status: 500 }));
  await page.goBack();
}

test("reports ok from the health check", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
});
