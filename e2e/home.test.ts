import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { languageNames } from "../app/language-names.ts";
import { baseLocale, locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { isPhone, openLanguageMenu } from "./frame.ts";

const texts: Record<
  Locale,
  {
    badge: string;
    longBadge: string;
    navigation: string;
    visitorLinks: readonly (readonly [string, string])[];
    switchLabel: string;
    signInTitle: string;
    joinLink: string;
    notFoundTitle: string;
    notFoundBody: string;
    backHomeLink: string;
    unexpectedErrorTitle: string;
    unexpectedErrorBody: string;
  }
> = {
  id: {
    badge: "Simulasi · ±10 mnt",
    longBadge: "Simulasi · harga tertunda ±10 mnt",
    navigation: "Navigasi utama",
    visitorLinks: [
      ["Gabung ke kelas", "/join"],
      ["Masuk", "/sign-in"],
    ],
    switchLabel: "Bahasa",
    signInTitle: "Masuk",
    joinLink: "Gabung ke kelas dengan kodenya",
    notFoundTitle: "Halaman tidak ditemukan",
    notFoundBody:
      "Alamat ini tidak ada di Portolab. Periksa kembali alamatnya, atau kembali ke beranda.",
    backHomeLink: "Kembali ke beranda",
    unexpectedErrorTitle: "Terjadi kesalahan",
    unexpectedErrorBody:
      "Portolab tidak dapat menampilkan halaman ini. Coba muat ulang halaman. Jika masalahnya berlanjut, beri tahu dosen Anda.",
  },
  en: {
    badge: "Simulation · ±10 min",
    longBadge: "Simulation · prices delayed ±10 min",
    navigation: "Main navigation",
    visitorLinks: [
      ["Join a class", "/join"],
      ["Sign in", "/sign-in"],
    ],
    switchLabel: "Language",
    signInTitle: "Sign in",
    joinLink: "Join a class with its code",
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
    page.getByRole("heading", { level: 1, name: "Masuk" }),
  ).toBeVisible();
});

for (const locale of locales.filter((other) => other !== baseLocale)) {
  test(`switches the page to ${languageNames[locale]} and back`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/");
    await openLanguageMenu(page);
    await page.getByRole("button", { name: languageNames[baseLocale] }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", baseLocale);
  });
}

for (const locale of locales) {
  const text = texts[locale];

  test(`opens sign-in with a link to join in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/");
    await expect(page).toHaveURL("/sign-in");
    await expect(
      page.getByRole("heading", { level: 1, name: text.signInTitle }),
    ).toBeVisible();
    await expect(page).toHaveTitle(`${text.signInTitle} | Portolab`);
    // A phone shows the short badge of the simulation, and a desktop the long one.
    await expect(
      page.getByRole("button", {
        name: isPhone() ? text.badge : text.longBadge,
      }),
    ).toBeVisible();
    // The redirected page keeps sign-in current in the visitor navigation.
    const navigation = page.getByRole("navigation", { name: text.navigation });
    await expect(navigation.getByRole("listitem")).toHaveCount(
      text.visitorLinks.length,
    );
    for (const [name, path] of text.visitorLinks) {
      await expect(
        navigation.getByRole("link", { name, exact: true }),
      ).toHaveAttribute("href", path);
    }
    await expect(navigation.locator("[aria-current]")).toHaveCount(1);
    await openLanguageMenu(page);
    await expect(
      page.getByRole("group", { name: text.switchLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: languageNames[locale] }),
    ).toHaveAttribute("aria-pressed", "true");
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.joinLink }).click();
    await expect(page).toHaveURL("/join");
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
  await expect(page).toHaveURL("/sign-in");
  await page.route(/\.data(\?|$)/, (route) => route.fulfill({ status: 500 }));
  await page.goBack();
}

test("reports ok from the health check", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
});
