import { screenshotFullHeight } from "./screenshot-full-height.ts";
import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
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
    statisticsWindow: string;
    chart: string;
    chartLast: string;
    range: string;
    ranges: readonly string[];
    points: string;
    date: string;
    calculations: string;
    buy: string;
    sell: string;
    noCloses: string;
    quote: string;
    trade: string;
    rangeHelp: string;
    betaHelp: string;
    portfolioQuotes: string;
  }
> = {
  id: {
    portfolioQuotes: "Waktu harga portofolio di Beranda",
    rangeHelp: "Apa itu Rentang 52 minggu?",
    betaHelp: "Apa itu Beta?",
    quote: "30 Okt 2026, 16.14 · penutupan sebelumnya Rp 4.940",
    trade: "Order saham",
    title: "Saham BBCA",
    back: "Kembali ke Pasar",
    held: "Keuangan · LQ45 · ada di portofolio Anda",
    position: "Posisi Anda",
    statistics: "Statistik",
    statisticsWindow: "β, σ, E(R): 60 imbal hasil bulanan sampai Sep 2026",
    chart: "Harga penutupan BBCA",
    chartLast: "30 Okt 2026: BBCA Rp\u00a04.980",
    range: "Rentang grafik harga",
    ranges: ["1B", "3B", "1T", "5T"],
    points: "Lihat harga penutupan",
    date: "Tanggal penutupan",
    calculations: "Semua perhitungan dan imbal hasil bulanan",
    buy: "Beli",
    sell: "Jual",
    noCloses:
      "Belum ada harga penutupan dalam rentang ini. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan dalam rentang ini.",
  },
  en: {
    portfolioQuotes: "Portfolio quote times in Home",
    rangeHelp: "What is 52-week range?",
    betaHelp: "What is Beta?",
    quote: "Oct 30, 2026, 4:14 PM · previous close IDR 4,940",
    trade: "Stock order",
    title: "BBCA stock",
    back: "Back to Market",
    held: "Financials · LQ45 · held in your portfolio",
    position: "Your position",
    statistics: "Statistics",
    statisticsWindow: "β, σ, E(R): 60 monthly returns through Sep 2026",
    chart: "BBCA closing prices",
    chartLast: "Oct 30, 2026: BBCA IDR\u00a04,980",
    range: "Price chart range",
    ranges: ["1M", "3M", "1Y", "5Y"],
    points: "View closing prices",
    date: "Close date",
    calculations: "All calculations and monthly returns",
    buy: "Buy",
    sell: "Sell",
    noCloses:
      "There are no closing prices in this range yet. Check again when a price history update stores closes in this range.",
  },
};

async function expectChangeInk(page: Page): Promise<void> {
  const chartTokens = {
    rise: "--color-gain",
    fall: "--color-loss",
    none: "--color-muted",
  } as const;
  for (const [direction, token] of Object.entries(chartTokens)) {
    for (const line of await page
      .locator(`[data-line="${direction}"] path[vector-effect]`)
      .all())
      await expect(line).toHaveCSS("stroke", await tokenColor(page, token));
  }
  const tokens = {
    rise: {
      ink: "--color-gain",
      pillInk: "--color-gain",
      tint: "--color-gain-soft",
    },
    fall: {
      ink: "--color-loss",
      pillInk: "--color-loss-on-soft",
      tint: "--color-loss-soft",
    },
  } as const;
  for (const [direction, token] of Object.entries(tokens)) {
    for (const value of await page
      .locator(`[data-change="${direction}"]`)
      .all()) {
      const isQuote = await value.evaluate(
        (element) => element.closest("main header") !== null,
      );
      await expect(value).toHaveCSS(
        "color",
        await tokenColor(page, isQuote ? token.pillInk : token.ink),
      );
      if (isQuote) {
        await expect(value.locator("..")).toHaveCSS(
          "background-color",
          await tokenColor(page, token.tint),
        );
      }
    }
  }
}

async function openHeldStock(
  page: Page,
  browser: Browser,
  locale: Locale,
): Promise<{ student: Page; classPath: string; path: string }> {
  const { student, classPath } = await studentWithPortfolio(page, browser, {
    locale,
    givePortfolio: (classId) => {
      storeTestHolding(classId, bbcaHolding);
    },
  });
  const path = `${classPath}/stocks/BBCA`;
  await student.goto(path);
  return { student, classPath, path };
}

for (const locale of locales) {
  const text = texts[locale];
  test(`opens a held stock and explores its closes in ${locale}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath, path } = await openHeldStock(
      page,
      browser,
      locale,
    );
    await expect(student).toHaveTitle(`${text.title} | Portolab`);
    await expect(student.getByText(text.held, { exact: true })).toBeVisible();
    await expect(
      student.getByRole("heading", { name: text.position }),
    ).toBeVisible();
    await expect(
      student.getByRole("heading", { name: text.statistics }),
    ).toBeVisible();
    await expect(
      student.getByText(text.statisticsWindow, { exact: true }),
    ).toBeVisible();
    const quoteTimes = student.getByRole("link", {
      name: text.portfolioQuotes,
    });
    await expect(quoteTimes).toBeVisible();
    await expect(quoteTimes).toHaveAttribute(
      "href",
      `${classPath}#home-holdings-heading`,
    );
    await quoteTimes.click();
    await expect(student.locator("#home-holdings-heading")).toBeInViewport();
    await student.goBack();
    await expect(student).toHaveURL(path);
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
    await student.context().close();
  });

  test(`keeps the held stock layout and change ink at reference widths in ${locale}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student } = await openHeldStock(page, browser, locale);
    const widths = testInfo.project.name === "phone" ? [360] : [1440, 1920];
    for (const width of widths) {
      await student.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        await expectChangeInk(student);
        expect(await layoutProblems(student)).toEqual([]);
        const [rangeGroup, beta] = await Promise.all(
          [text.rangeHelp, text.betaHelp].map((label) =>
            student
              .getByRole("button", { name: label, exact: true })
              .evaluate((element) => {
                const box = element.closest("dl")?.getBoundingClientRect();
                return box === undefined
                  ? undefined
                  : { width: box.width, top: box.top };
              }),
          ),
        );
        if (rangeGroup === undefined || beta === undefined)
          throw new Error("The stock statistics are visible.");
        expect(rangeGroup.width).toBeGreaterThan(beta.width * 1.5);
        if (testInfo.project.name === "phone") {
          expect(beta.top).toBeGreaterThan(rangeGroup.top);
        } else {
          expect(beta.top).toBeCloseTo(rangeGroup.top, 0);
        }
        await screenshotFullHeight(student, {
          path: testInfo.outputPath(
            `stock-${locale}-${String(width)}-${colorScheme}.png`,
          ),
        });
      }
    }
    await student.context().close();
  });

  test(`opens the held stock closing data and calculations in ${locale}`, async ({
    page,
    browser,
  }) => {
    const { student } = await openHeldStock(page, browser, locale);
    await student.getByText(text.points, { exact: true }).click();
    await expect(
      student.getByRole("columnheader", { name: text.date }),
    ).toBeVisible();
    await student.getByText(text.calculations, { exact: true }).click();
    await expectAccessibleScreen(student);
    expect(await layoutProblems(student)).toEqual([]);
    await student.context().close();
  });

  test(`starts each side of an order from a held stock and returns to the market in ${locale}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classPath, path } = await openHeldStock(
      page,
      browser,
      locale,
    );
    await student.goto(`${path}?range=1y`);
    await student.getByText(text.points, { exact: true }).click();
    await expect(
      student.getByRole("columnheader", { name: text.date }),
    ).toBeVisible();
    for (const [side, label] of [
      ["buy", text.buy],
      ["sell", text.sell],
    ] as const) {
      const startTrade = student.getByRole("link", {
        name: label,
        exact: true,
      });
      await startTrade.scrollIntoViewIfNeeded();
      const scroll = await student.evaluate(() => window.scrollY);
      await startTrade.click();
      await expect(student).toHaveURL(
        `${classPath}/stocks/BBCA/${side}?range=1y`,
      );
      await expect(
        student.locator(`dialog a[data-side="${side}"]`),
      ).toHaveAttribute("data-selected", "true");
      if (testInfo.project.name === "phone") {
        await student.keyboard.press("Escape");
        await expect(student).toHaveURL(`${path}?range=1y`);
        await expect(startTrade).toBeFocused();
        await expect
          .poll(() => student.evaluate(() => window.scrollY))
          .toBeCloseTo(scroll, 0);
        await expect(
          student.getByRole("columnheader", { name: text.date }),
        ).toBeVisible();
      } else {
        await student.goto(`${path}?range=1y`);
      }
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
      await expect(
        page.getByRole("link", { name: text.portfolioQuotes }),
      ).toHaveCount(0);
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
      await expect(page.locator('dialog a[data-side="sell"]')).toHaveAttribute(
        "data-selected",
        "true",
      );
      await lecturer.context().close();
    });
  });
}
