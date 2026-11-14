import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";

const texts: Record<Locale, { search: string; close: string }> = {
  id: {
    search: "Cari nama atau nama pengguna",
    close: "Tutup panel mahasiswa",
  },
  en: { search: "Search name or username", close: "Close student panel" },
};

for (const locale of locales) {
  test(`keeps native student selection and a search draft when JavaScript enhances the panel in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeGradingPortfolio,
    });
    const scripts = await holdClientScripts(page);
    try {
      await page.goto(`${classPath}/students`, { waitUntil: "commit" });
      await expect.poll(scripts.heldCount).toBeGreaterThan(0);
      await Promise.all([
        page.waitForURL(/student=\d+/, { waitUntil: "commit" }),
        page
          .locator("main tbody tr")
          .first()
          .getByRole("link")
          .click({ noWaitAfter: true }),
      ]);
      const panel = page.getByRole("dialog");
      await expect(panel).toBeVisible();
      expect(await panel.evaluate((element) => element.matches(":modal"))).toBe(
        false,
      );
      const search = page.getByRole("searchbox", {
        name: texts[locale].search,
      });
      await search.fill("Unsent search");
      const address = page.url();
      scripts.release();
      await page.waitForLoadState("load");
      await expect(page.getByRole("slider").first()).toBeVisible();
      await expect
        .poll(() => panel.evaluate((element) => element.matches(":modal")))
        .toBe((page.viewportSize()?.width ?? 0) < 1320);
      await expect(search).toHaveValue("Unsent search");
      await expect(page).toHaveURL(address);
      await panel.getByRole("link", { name: texts[locale].close }).click();
      await expect(page).not.toHaveURL(/student=/);
      await expect(search).toHaveValue("Unsent search");
      await expect(
        page.locator("main tbody tr").first().getByRole("link"),
      ).toBeFocused();
    } finally {
      await scripts.dispose();
      await student.context().close();
    }
  });
}
