import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { newDevice } from "./new-device.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { captureScreens } from "./capture-screens.ts";

const texts: Record<
  Locale,
  {
    title: string;
    axis: string;
    risk: string;
    points: string;
    omitted: string;
    back: string;
    search: string;
    range: string;
    ranges: readonly (readonly [string, string])[];
  }
> = {
  id: {
    title: "Peta saham LQ45",
    axis: "Sumbu risiko",
    risk: "Simpangan baku",
    points: "Lihat titik pada peta",
    omitted: "Belum ada di peta",
    back: "Kembali ke Pasar",
    search: "Cari saham",
    range: "Rentang perubahan harga",
    ranges: [
      ["1B", "1m"],
      ["3B", "3m"],
      ["1T", "1y"],
    ],
  },
  en: {
    title: "LQ45 stock map",
    axis: "Risk axis",
    risk: "Standard deviation",
    points: "See the points on the map",
    omitted: "Not on the map yet",
    back: "Back to Market",
    search: "Search stocks",
    range: "Price change range",
    ranges: [
      ["1M", "1m"],
      ["3M", "3m"],
      ["1Y", "1y"],
    ],
  },
};

for (const locale of locales)
  test(`opens stocks from the map and keeps ranges and filters before and after scripts load in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeTestHolding(classId, bbcaHolding);
    const native = await newDevice(browser, locale, {
      sessionFrom: student,
      javaScriptEnabled: false,
    });
    try {
      const address = `${classPath}/market?view=map`;
      await native.goto(address);
      const map = native.getByRole("region", { name: texts[locale].title });
      await expect(map.locator("svg").first()).toBeVisible();
      await expectMapLabelsClear(map.locator("svg").first());
      for (const [label, value] of texts[locale].ranges) {
        await native
          .getByRole("navigation", { name: texts[locale].range })
          .getByRole("link", { name: label, exact: true })
          .click();
        expect(new URL(native.url()).searchParams.get("mapRange")).toBe(value);
      }
      await native
        .getByRole("navigation", { name: texts[locale].axis })
        .getByRole("link", { name: texts[locale].risk, exact: true })
        .click();
      await expect(native).toHaveURL(/axis=risk/);
      await expectMapLabelsClear(map.locator("svg").first());
      await native
        .getByRole("region", { name: texts[locale].title })
        .getByRole("link", { name: "BBCA", exact: true })
        .first()
        .click();
      await expect(native).toHaveURL(/\/stocks\/BBCA/);
      await native
        .getByRole("link", { name: texts[locale].back, exact: true })
        .click();
      await expect(native).toHaveURL(/axis=risk.*mapRange=1y#market-map-title/);
      await expect(
        native.getByRole("heading", { name: texts[locale].title }),
      ).toBeInViewport();
      await holdClientScripts(student, { address }, async (loadClient) => {
        await student
          .getByRole("searchbox", { name: texts[locale].search })
          .fill("BBCA");
        await loadClient();
        await expect(
          student.getByRole("searchbox", { name: texts[locale].search }),
        ).toHaveValue("BBCA");
        await expect(
          student.getByRole("slider", { name: texts[locale].title }),
        ).toBeVisible();
        await expect(
          student.getByRole("heading", { name: texts[locale].omitted }),
        ).toHaveCount(0);
      });
      await student.goto(address);
      const currentMap = student.getByRole("region", {
        name: texts[locale].title,
      });
      await expect(currentMap.getByRole("slider")).toBeVisible();
      await expectMapLabelsClear(currentMap.locator("svg").first());
      await expectAccessibleScreen(student);
      await captureScreens(student, testInfo, {
        name: `market-map-${locale}`,
        fullPage: true,
        fromTop: true,
        check: () => expectMapLabelsClear(currentMap.locator("svg").first()),
      });
      await currentMap.getByText(texts[locale].points, { exact: true }).click();
      await expect(currentMap.getByRole("row", { name: /BBCA/ })).toBeVisible();
    } finally {
      await native.context().close();
      await student.context().close();
    }
  });
