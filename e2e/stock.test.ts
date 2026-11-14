import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { tokenColor } from "./token-color.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";

const texts: Record<
  Locale,
  {
    title: string;
    back: string;
    held: string;
    position: string;
    statistics: string;
    chart: string;
    chartLast: string;
    range: string;
    ranges: readonly string[];
    points: string;
    date: string;
    calculations: string;
    buy: string;
    sell: string;
    side: string;
    noCloses: string;
    quote: string;
    trade: string;
  }
> = {
  id: {
    quote: "30 Okt 2026, 16.14 · penutupan sebelumnya Rp 4.940",
    trade: "Order saham",
    title: "Saham BBCA",
    back: "Kembali ke Pasar",
    held: "Ada di portofolio Anda",
    position: "Posisi Anda",
    statistics: "Statistik",
    chart: "Harga penutupan BBCA",
    chartLast: "30 Okt 2026: BBCA Rp\u00a04.980",
    range: "Rentang grafik harga",
    ranges: ["1B", "3B", "1T", "5T"],
    points: "Lihat harga penutupan",
    date: "Tanggal penutupan",
    calculations: "Semua perhitungan dan imbal hasil bulanan",
    buy: "Beli",
    sell: "Jual",
    side: "Sisi order",
    noCloses:
      "Belum ada harga penutupan dalam rentang ini. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan dalam rentang ini.",
  },
  en: {
    quote: "Oct 30, 2026, 4:14 PM · previous close IDR 4,940",
    trade: "Stock order",
    title: "BBCA stock",
    back: "Back to Market",
    held: "Held in your portfolio",
    position: "Your position",
    statistics: "Statistics",
    chart: "BBCA closing prices",
    chartLast: "Oct 30, 2026: BBCA IDR\u00a04,980",
    range: "Price chart range",
    ranges: ["1M", "3M", "1Y", "5Y"],
    points: "View closing prices",
    date: "Close date",
    calculations: "All calculations and monthly returns",
    buy: "Buy",
    sell: "Sell",
    side: "Side",
    noCloses:
      "There are no closing prices in this range yet. Check again when a price history update stores closes in this range.",
  },
};

async function expectChangeInk(page: Page): Promise<void> {
  const tokens = { rise: "--color-gain", fall: "--color-loss" } as const;
  for (const [direction, token] of Object.entries(tokens)) {
    for (const value of await page
      .locator(`[data-change="${direction}"]`)
      .all()) {
      await expect(value).toHaveCSS("color", await tokenColor(page, token));
    }
  }
}

for (const locale of locales) {
  const text = texts[locale];
  test(`opens a held stock, explores its closes and calculations, and starts each side of an order in ${locale}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestHolding(classId, bbcaHolding);
      },
    });
    const path = `${classPath}/stocks/BBCA`;
    await student.goto(path);
    await expect(student).toHaveTitle(`${text.title} | Portolab`);
    await expect(student.getByText(text.held, { exact: true })).toBeVisible();
    await expect(
      student.getByRole("heading", { name: text.position }),
    ).toBeVisible();
    await expect(
      student.getByRole("heading", { name: text.statistics }),
    ).toBeVisible();
    const range = student.getByRole("navigation", { name: text.range });
    await expect(range.getByRole("link")).toHaveText(text.ranges);
    const values = ["1m", "3m", "1y", "5y"];
    for (const [index, label] of text.ranges.entries()) {
      await range.getByRole("link", { name: label, exact: true }).click();
      await expect(student).toHaveURL(`${path}?range=${values[index] ?? ""}`);
      await expect(
        range.getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("aria-current", "true");
    }
    await range.getByRole("link").nth(2).click();
    const slider = student.getByRole("slider", { name: text.chart });
    await slider.focus();
    await slider.press("Home");
    const first = await slider.getAttribute("aria-valuetext");
    await slider.press("End");
    await expect(slider).not.toHaveAttribute("aria-valuetext", first ?? "");
    await expect(slider).toHaveAttribute("aria-valuetext", text.chartLast);
    await slider.press("Escape");
    await student.getByRole("heading", { level: 1 }).click();
    await expectAccessibleScreen(student);
    const widths = testInfo.project.name === "phone" ? [360] : [1440, 1920];
    for (const width of widths) {
      await student.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        await expectChangeInk(student);
        expect(await layoutProblems(student)).toEqual([]);
        await student.screenshot({
          path: testInfo.outputPath(
            `stock-${locale}-${String(width)}-${colorScheme}.png`,
          ),
          fullPage: true,
        });
      }
    }
    await student.getByText(text.points, { exact: true }).click();
    await expect(
      student.getByRole("columnheader", { name: text.date }),
    ).toBeVisible();
    await student.getByText(text.calculations, { exact: true }).click();
    await expectAccessibleScreen(student);
    expect(await layoutProblems(student)).toEqual([]);
    for (const [side, label] of [
      ["buy", text.buy],
      ["sell", text.sell],
    ] as const) {
      await student.getByRole("link", { name: label, exact: true }).click();
      await expect(student).toHaveURL(
        `${classPath}/orders?code=BBCA&side=${side}`,
      );
      await expect(
        student.getByRole("radio", { name: label, exact: true }),
      ).toBeChecked();
      await student.goto(path);
    }
    await student.getByRole("link", { name: text.back }).click();
    await expect(student).toHaveURL(`${classPath}/market`);
    await student.context().close();
  });

  test(`shows a stock not held, a shorter history, too few returns, and missing closes in ${locale}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    for (const code of ["AMMN", "AADI", "ADMR", "UNVR", "WIFI"]) {
      await student.goto(`${classPath}/stocks/${code}`);
      await expect(
        student.getByRole("heading", { name: text.position }),
      ).toHaveCount(0);
      await expect(
        student.getByRole("heading", { name: text.statistics }),
      ).toBeVisible();
      if (code === "ADMR")
        await expect(
          student.getByText(text.noCloses, { exact: true }).first(),
        ).toBeVisible();
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        await expectChangeInk(student);
      }
      await expectAccessibleScreen(student);
    }
    await student.context().close();
  });

  test.describe(`before JavaScript loads in ${locale}`, () => {
    test.use({ javaScriptEnabled: false });
    test("draws the price chart, changes its range, opens help, and reaches the order form", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "/stocks/BBCA",
      });
      await expect(page.getByRole("slider")).toHaveCount(0);
      await expect(page.locator("main svg path").first()).toBeVisible();
      await page
        .getByRole("navigation", { name: text.range })
        .getByRole("link")
        .first()
        .click();
      await expect(page).toHaveURL(/range=1m$/);
      await page.locator("main button[popovertarget]").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByText(text.points, { exact: true }).click();
      await expect(
        page.getByRole("columnheader", { name: text.date }),
      ).toBeVisible();
      await page.getByRole("link", { name: text.sell, exact: true }).click();
      await expect(
        page.getByRole("radio", { name: text.sell, exact: true }),
      ).toBeChecked();
      await lecturer.context().close();
    });
  });
}
