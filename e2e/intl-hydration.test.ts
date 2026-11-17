import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { writeIntlSpacesForTest } from "../app/write-intl-spaces-for-test.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { storeActivityOrders } from "./store-activity-orders.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";

// The browser of a reader can ship other data of Intl than Node, such as the narrow no-break space that CLDR 42 writes before AM or PM in English. This browser writes it wherever its data writes a space, while the server writes the spaces of Node.
const browserSpace = "\u202f";

// The times are those of the quote of KLBF in fixture-price-source.server.ts, which Pasar shows beside its price because it differs from the shared time, and of the filled sale of storeActivityOrders, and the delay is the one of the fixture price source.
const texts: Record<
  Locale,
  {
    quoteTime: string;
    fillTime: string;
    delay: string;
    filter: string;
    all: string;
    orders: string;
  }
> = {
  id: {
    quoteTime: "16.13",
    fillTime: "10.05",
    delay: "±10\u00a0mnt",
    filter: "Saring menurut status",
    all: "Semua · 5",
    orders: "Order",
  },
  en: {
    quoteTime: "4:13 PM",
    fillTime: "10:05 AM",
    delay: "±10\u00a0min",
    filter: "Filter by status",
    all: "All · 5",
    orders: "Orders",
  },
};

/** The texts of the regions of a page that a check compares before and after JavaScript loads. */
async function textsOf(regions: readonly Locator[]): Promise<string[]> {
  const contents: string[] = [];
  for (const region of regions)
    contents.push(...(await region.allTextContents()));
  return contents;
}

/** Checks that the browser writes its own space before the scripts of the app load, so that the page would differ if the app wrote the spaces of Intl. */
async function expectBrowserSpace(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => new Intl.ListFormat("en").format(["one", "two"])),
  ).toBe(`one${browserSpace}and${browserSpace}two`);
}

for (const locale of locales) {
  const text = texts[locale];

  test(`keeps the times, amounts, and units of the server when JavaScript loads in a browser with other data of Intl, in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      {
        locale,
        className: "Manajemen Portofolio",
        lecturerName: "Dosen Intl",
        studentName: "Mahasiswa Intl",
      },
    );
    storeActivityOrders(classId);
    await student.addInitScript(writeIntlSpacesForTest, browserSpace);
    const badge = student.locator('button[popovertarget="simulation-card"]');
    const stocks = student.locator(
      "main section[aria-labelledby=stocks-heading]",
    );
    await holdClientScripts(
      student,
      { address: `${classPath}/market` },
      async (loadClient) => {
        await expectBrowserSpace(student);
        const serverTexts = await textsOf([badge, stocks]);
        expect(serverTexts[0]).toContain(text.delay);
        expect(serverTexts[1]).toContain(text.quoteTime);
        await loadClient();
        await expect(
          student.getByRole("slider", { name: "IHSG", exact: true }),
        ).toBeVisible();
        expect(await textsOf([badge, stocks])).toEqual(serverTexts);
      },
    );
    await expectAccessibleScreen(student);
    const orders = student.getByRole("region", {
      name: text.orders,
      exact: true,
    });
    await holdClientScripts(
      student,
      { address: `${classPath}/activity` },
      async (loadClient) => {
        await expectBrowserSpace(student);
        const serverTexts = await textsOf([badge, orders]);
        expect(serverTexts[1]).toContain(text.fillTime);
        await loadClient();
        const clientNavigation = student.waitForRequest((request) =>
          new URL(request.url()).pathname.endsWith(".data"),
        );
        await student
          .getByRole("navigation", { name: text.filter })
          .getByRole("link", { name: text.all, exact: true })
          .click();
        await clientNavigation;
        expect(await textsOf([badge, orders])).toEqual(serverTexts);
      },
    );
  });
}
