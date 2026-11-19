import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";

const texts: Record<Locale, { search: string }> = {
  id: { search: "Cari nama, NIM, atau nama pengguna" },
  en: { search: "Search name, NIM, or username" },
};

for (const locale of locales) {
  test(`keeps a search draft when JavaScript loads, and then opens a student from the row with the client in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeGradingPortfolio,
    });
    await holdClientScripts(
      page,
      { otherDevice: student.context(), address: `${classPath}/students` },
      async (loadClient) => {
        const search = page.getByRole("searchbox", {
          name: texts[locale].search,
        });
        await search.fill("Unsent search");
        const address = page.url();
        await loadClient();
        await page.waitForFunction(() => "__reactRouterDataRouter" in window);
        await expect(search).toHaveValue("Unsent search");
        await expect(page).toHaveURL(address);
        const clientNavigation = page.waitForRequest((request) =>
          new URL(request.url()).pathname.endsWith(".data"),
        );
        await page.locator("main tbody tr").first().getByRole("link").click();
        await clientNavigation;
        await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
      },
    );
  });
}
