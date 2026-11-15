import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { createMarketClass } from "./create-market-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { newDevice } from "./new-device.ts";

for (const locale of locales) {
  test(`keeps market code ordering through hydration on a Danish device in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    const testClass = await createMarketClass(page);
    const device = await newDevice(browser, locale, {
      locale: "da-DK",
      storageState: await page.context().storageState(),
    });
    try {
      for (const { sort, first } of [
        { sort: "code", first: ["AADI", "ADMR", "ADRO"] },
        {
          sort: "beta",
          first: ["BBCA", "TLKM", "AMMN", "AADI", "ADMR", "ADRO"],
        },
      ]) {
        await holdClientScripts(
          device,
          {
            address: `${testClass.path}/market?sort=${sort}&direction=ascending`,
          },
          async (loadClient) => {
            expect(
              await device.evaluate(() => "AADI".localeCompare("BBCA")),
            ).toBeGreaterThan(0);
            await expect(device.getByRole("slider")).toHaveCount(0);
            const rows = device.locator(
              "main section[aria-labelledby=stocks-heading] tbody tr",
            );
            await expect(rows).toHaveCount(45);
            const before = await rows.evaluateAll((elements) =>
              elements.map((element) => element.id),
            );
            expect(before.slice(0, first.length)).toEqual(
              first.map((code) => `stock-${code}`),
            );
            await loadClient();
            await expect(
              device.getByRole("slider", { name: "IHSG", exact: true }),
            ).toBeVisible();
            expect(
              await rows.evaluateAll((elements) =>
                elements.map((element) => element.id),
              ),
            ).toEqual(before);
          },
        );
      }
      await expectAccessibleScreen(device);
    } finally {
      await device.context().close();
    }
  });
}
