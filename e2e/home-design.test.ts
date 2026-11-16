import {
  storeHomeDesignPortfolio,
  homeDesignStartingCash,
} from "./store-home-design-portfolio.ts";
import type { Locator } from "@playwright/test";
import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { expectCompactChoice } from "./expect-compact-choice.ts";
import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { newDevice } from "./new-device.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { isPhone } from "./frame.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";

const texts: Record<
  Locale,
  {
    map: string;
    time: string;
    title: string;
    learn: string;
    prices: string;
    average: string;
  }
> = {
  id: {
    map: "Peta",
    time: "Grafik waktu",
    title: "Posisi Anda di peta",
    learn: "Pelajari",
    prices: "Harga 30 Okt 2026, 16.14 WIB.",
    average: "Harga rata-rata",
  },
  en: {
    map: "Map",
    time: "Time chart",
    title: "Your position on the map",
    learn: "Learn",
    prices: "Prices Oct 30, 2026, 4:14 PM WIB.",
    average: "Average price",
  },
};

for (const locale of locales) {
  test(`keeps Beranda inside the frame at reference widths in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId } = await studentOfNewClass(page, browser, {
      locale,
      className: "Manajemen Portofolio A",
      lecturerName: "Dosen",
      studentName: "Mahasiswa",
      startingCash: homeDesignStartingCash,
    });
    storeHomeDesignPortfolio(classId);
    await student.reload();
    await expectAccessibleScreen(student);
    const panel = student.getByRole("region", { name: texts[locale].title });
    await expect(
      student.getByText(texts[locale].prices, { exact: true }),
    ).toHaveCount(1);
    await expect(
      student.locator("td").filter({ hasText: /16[.:]14/ }),
    ).toHaveCount(0);
    if (isPhone())
      await expect(
        student.locator('main ul[data-layout="rows"]'),
      ).not.toContainText(texts[locale].average);
    for (const width of isPhone() ? [360] : [1440, 1920]) {
      await student.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        for (const view of ["map", "time"] as const) {
          await panel
            .getByRole("link", { name: texts[locale][view], exact: true })
            .click();
          expect(await layoutProblems(student)).toEqual([]);
          await expectHomeMap(panel, view);
          await student.mouse.move(0, 0);
          const height = await student
            .locator("body")
            .evaluate((body) => body.scrollHeight);
          await student.setViewportSize({ width, height });
          await student.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await student.screenshot({
            path: test
              .info()
              .outputPath(
                `home-${locale}-${String(width)}-${colorScheme}-${view}.png`,
              ),
            fullPage: true,
            scale: "css",
          });
        }
      }
    }
    await expectAccessibleScreen(student);
    const chart = panel.getByRole("slider");
    await chart.focus();
    await student.keyboard.press("Home");
    await expect(chart).toHaveAttribute("aria-valuenow", "0");
    await student.keyboard.press("Escape");
    await student.goBack();
    await expect(
      panel.getByRole("link", { name: texts[locale].map, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const native = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      storageState: await student.context().storageState(),
    });
    await native.goto(student.url());
    await expectHomeMap(
      native.getByRole("region", { name: texts[locale].title }),
      "map",
    );
    await native
      .getByRole("link", { name: texts[locale].time, exact: true })
      .click();
    await expect(native).toHaveURL(/\?view=time$/);
    await native
      .getByRole("region", { name: texts[locale].title, exact: true })
      .getByRole("link", { name: texts[locale].learn, exact: true })
      .click();
    await expect(native).toHaveURL(/\/learn\/\d+\?returnTo=/u);
    await expect(native.getByRole("heading", { level: 1 })).toBeVisible();
    await native.context().close();
    const scriptGate = Promise.withResolvers<undefined>();
    await student.route(/\.js(?:\?|$)/, async (route) => {
      await scriptGate.promise;
      await route.continue();
    });
    try {
      await student.reload({ waitUntil: "commit" });
      await expect(panel.getByRole("slider")).toHaveCount(0);
      const learn = panel.getByRole("link", {
        name: texts[locale].learn,
        exact: true,
      });
      await expect(learn).toHaveAttribute("href", /\/learn\/\d+\?returnTo=/u);
      const address = student.url();
      scriptGate.resolve(undefined);
      await student.waitForLoadState("load");
      await expect(panel.getByRole("slider")).toBeVisible();
      await learn.click();
      await expect(
        student.getByRole("dialog").filter({ has: student.locator("article") }),
      ).toBeVisible();
      await expect(student).toHaveURL(address);
      await student.keyboard.press("Escape");
      await expect(learn).toBeFocused();
    } finally {
      scriptGate.resolve(undefined);
      await student.unrouteAll({ behavior: "wait" });
    }
    await student.context().close();
  });
}

async function expectHomeMap(
  panel: Locator,
  view: "map" | "time",
): Promise<void> {
  await expectCompactChoice(panel.getByRole("navigation"));
  if (view === "map")
    await expectMapLabelsClear(panel.locator("svg:has([data-map-label])"));
}
