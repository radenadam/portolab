import type { Locator } from "@playwright/test";
import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { setFirstSessionDate } from "../app/features/classes/class-store.server.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { newDevice } from "./new-device.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { isPhone } from "./frame.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

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
      // Decimal adds the independently computed costs and cash below to Rp42,042,560, so the picture uses their scale. The layout walk separately checks the largest starting cash.
      startingCash: rupiah(42_042_560),
    });
    // The values and costs are the recorded quotes and independently computed fixture of measures-for-test.server.ts, which home-portfolio.test.tsx checks on this screen. As storeTestHolding explains, no fixture quote can fill an order, so the holdings are stored without orders.
    storeTestHolding(
      classId,
      {
        code: "BBCA",
        shares: shares(5_500),
        cost: rupiah(27_431_085),
        cash: rupiah(10_956_000),
      },
      [{ code: "AMMN", shares: shares(1_000), cost: rupiah(3_655_475) }],
    );
    writeForTestStudent(classId, (database, membershipId) => {
      setFirstSessionDate(database, classId, "2026-10-26");
      database
        .update(memberships)
        .set({ joinedAt: new Date("2026-10-26T10:00:00Z") })
        .where(eq(memberships.id, membershipId))
        .run();
    });
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
          await expectHomeMapLabels(panel, view);
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
    await expectHomeMapLabels(
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

async function expectHomeMapLabels(
  panel: Locator,
  view: "map" | "time",
): Promise<void> {
  if (view === "map")
    await expectMapLabelsClear(panel.locator("svg:has([data-map-label])"));
}
