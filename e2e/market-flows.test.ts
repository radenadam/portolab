import { holdClientScripts } from "./hold-client-scripts.ts";
import { screenshotWidths } from "./screenshot-widths.ts";
import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { fieldMaximumLength } from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { signInAsNewLecturer } from "./accounts.ts";
import { createMarketClass } from "./create-market-class.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";
import { layoutProblems } from "./expect-layout.ts";

const texts: Record<
  Locale,
  {
    title: string;
    signIn: string;
    search: string;
    indexHelp: string;
    calculation: string;
    apply: string;
    sort: string;
    direction: string;
    financials: string;
    all: string;
    clear: string;
    noResults: string;
    month: string;
    range: string;
    stockRange: string;
    table: string;
    back: string;
    unavailable: string;
    orderError: string;
  }
> = {
  id: {
    title: "Pasar",
    signIn: "Masuk",
    search: "Cari saham",
    indexHelp: "Apa itu IHSG?",
    calculation: "Lihat perhitungan",
    apply: "Terapkan",
    sort: "Urutkan menurut",
    direction: "Urutan",
    financials: "Keuangan · 5",
    all: "Semua · 45",
    clear: "Hapus pencarian",
    noResults:
      'Tidak ada saham LQ45 yang cocok dengan "tidakada" dan sektor yang dipilih. Hapus pencarian untuk melihat semua saham.',
    month: "1B",
    range: "Rentang grafik IHSG",
    stockRange: "Rentang grafik harga",
    table: "Penutupan IHSG pada setiap hari bursa",
    back: "Kembali ke Pasar",
    unavailable: "Halaman tidak ditemukan",
    orderError:
      'Kolom "Urutan" berisi "salah", yang bukan pilihan yang tersedia. Pilih Menurun atau Menaik, lalu terapkan lagi.',
  },
  en: {
    title: "Market",
    signIn: "Sign in",
    search: "Search stocks",
    indexHelp: "What is IHSG?",
    calculation: "View calculation",
    apply: "Apply",
    sort: "Sort by",
    direction: "Order",
    financials: "Financials · 5",
    all: "All · 45",
    clear: "Clear search",
    noResults:
      'No LQ45 stocks match "tidakada" and the chosen sector. Clear the search to see all stocks.',
    month: "1M",
    range: "IHSG chart range",
    stockRange: "Price chart range",
    table: "IHSG close on each trading day",
    back: "Back to Market",
    unavailable: "Page not found",
    orderError:
      'The field "Order" holds "salah", which is not an available choice. Choose Descending or Ascending, then apply again.',
  },
};
for (const locale of locales) {
  const text = texts[locale];
  for (const javaScriptEnabled of [true, false]) {
    test(`filters the class market and opens a stock in ${languageNames[locale]} with JavaScript ${String(javaScriptEnabled)}`, async ({
      page,
      browser,
    }) => {
      await chooseLanguage(page, locale);
      const testClass = await createMarketClass(page);
      const student = await newDevice(browser, locale, {
        javaScriptEnabled,
        locale: "tr-TR",
      });
      try {
        await signInAsTestStudent(student, testClass, "Mahasiswa Pasar");
        await student.goto(`${testClass.path}/market`);
        const rows = student.locator(
          "main section[aria-labelledby=stocks-heading] tbody tr",
        );
        await expect(rows).toHaveCount(45);
        await student.getByLabel(text.search, { exact: true }).fill("INDY");
        if (javaScriptEnabled) await expect(rows).toHaveCount(1);
        await student
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(rows).toHaveCount(1);
        await student
          .getByLabel(text.search, { exact: true })
          .fill("central asia");
        if (javaScriptEnabled) await expect(rows).toHaveCount(1);
        await student
          .getByRole("button", { name: text.indexHelp, exact: true })
          .click();
        const card = student.getByRole("dialog", { name: "IHSG", exact: true });
        await expect(card).toBeVisible();
        await card.getByText(text.calculation, { exact: true }).click();
        await expect(card.locator("details[open]")).toBeVisible();
        await student.keyboard.press("Escape");
        await expect(card).toBeHidden();
        await expect(
          student.getByLabel(text.search, { exact: true }),
        ).toHaveValue("central asia");
        await student
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(student).toHaveURL(/q=central\+asia/);
        await expect(rows).toHaveCount(1);
        await student
          .getByRole("navigation", { name: text.range })
          .getByRole("link", { name: text.month, exact: true })
          .click();
        await expect(student).toHaveURL(/range=1m/);
        await expect(
          student.getByLabel(text.search, { exact: true }),
        ).toHaveValue("central asia");
        await student
          .getByRole("link", { name: /BBCA.*Bank Central Asia/ })
          .click();
        await student.waitForURL(/\/stocks\/BBCA(?:\?|$)/);
        await student
          .getByRole("navigation", { name: text.stockRange })
          .getByRole("link", { name: text.month, exact: true })
          .click();
        await student.getByRole("link", { name: text.back }).click();
        await expect(student).toHaveURL(/#stock-BBCA$/);
        await expect(
          student.getByLabel(text.search, { exact: true }),
        ).toHaveValue("central asia");
        await student.getByLabel(text.search, { exact: true }).fill("");
        await student
          .getByRole("radio", { name: text.financials, exact: true })
          .check();
        await student
          .getByLabel(text.sort, { exact: true })
          .selectOption("code");
        await student
          .getByLabel(text.direction, { exact: true })
          .selectOption("ascending");
        await student
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(rows).toHaveCount(5);
        await expect(rows.first()).toContainText("BBCA");
        await student.getByLabel(text.search, { exact: true }).fill("tidakada");
        await student
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(student.getByText(text.noResults)).toBeVisible();
        await student.getByRole("link", { name: text.clear }).click();
        await expect(rows).toHaveCount(45);
        const widestSearch = "x".repeat(fieldMaximumLength);
        await student
          .getByLabel(text.search, { exact: true })
          .fill(widestSearch);
        await student
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(rows).toHaveCount(0);
        await expect(
          student.getByLabel(text.search, { exact: true }),
        ).toHaveValue(widestSearch);
        expect(await layoutProblems(student)).toEqual([]);
        const response = await student.goto(
          `${testClass.path}/market?direction=salah`,
        );
        expect(response?.status()).toBe(400);
        await expect(student.getByText(text.orderError)).toBeVisible();
        await expect(
          student.getByLabel(text.direction, { exact: true }),
        ).toHaveValue("salah");
        if (javaScriptEnabled) await expectAccessibleScreen(student);
        else expect(await layoutProblems(student)).toEqual([]);
      } finally {
        await student.context().close();
      }
    });
  }
  test(`keeps native market filters and help when JavaScript loads in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const testClass = await createMarketClass(page);
    await page.goto(`${testClass.path}/market`);
    const scripts = await holdClientScripts(page);
    try {
      await scripts.reloadNativePage();
      await page.getByLabel(text.search, { exact: true }).fill("central asia");
      await page
        .getByRole("radio", { name: text.financials, exact: true })
        .check();
      await page.getByLabel(text.sort, { exact: true }).selectOption("code");
      await page
        .getByLabel(text.direction, { exact: true })
        .selectOption("ascending");
      await page
        .getByRole("button", { name: text.indexHelp, exact: true })
        .click();
      const card = page.getByRole("dialog", { name: "IHSG", exact: true });
      await card.getByText(text.calculation, { exact: true }).click();
      await expect(card.locator("details[open]")).toBeVisible();
      await scripts.release();
      await expect(
        page.getByRole("slider", { name: "IHSG", exact: true }),
      ).toBeVisible();
      await expect(card).toBeVisible();
      await expect(card.locator("details[open]")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByLabel(text.search, { exact: true })).toHaveValue(
        "central asia",
      );
      await expect(
        page.getByRole("radio", { name: text.financials, exact: true }),
      ).toBeChecked();
      await expect(page.getByLabel(text.sort, { exact: true })).toHaveValue(
        "code",
      );
      await expect(
        page.getByLabel(text.direction, { exact: true }),
      ).toHaveValue("ascending");
      await expect(
        page.locator("main section[aria-labelledby=stocks-heading] tbody tr"),
      ).toHaveCount(1);
      const stock = page.getByRole("link", { name: /BBCA.*Bank Central Asia/ });
      const address = await stock.getAttribute("href");
      expect(address).not.toBeNull();
      const target = new URL(address ?? "", page.url());
      const destination = new URL(
        target.searchParams.get("returnTo") ?? "",
        page.url(),
      );
      expect(destination.searchParams.get("q")).toBe("central asia");
      expect(destination.searchParams.get("sector")).toBe("financials");
      expect(destination.searchParams.get("sort")).toBe("code");
      expect(destination.searchParams.get("direction")).toBe("ascending");
    } finally {
      await scripts.dispose();
    }
  });
  test(`keeps the market private and the index explorable in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    const testClass = await createMarketClass(page);
    const path = `${testClass.path}/market`;
    await page.goto(path);
    const slider = page.getByRole("slider", { name: "IHSG", exact: true });
    await slider.focus();
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");
    await page.getByText(text.table, { exact: true }).click();
    await expect(page.locator("main details[open] table")).toBeVisible();
    await page.getByText(text.table, { exact: true }).click();
    await page.getByRole("link", { name: /BBCA.*Bank Central Asia/ }).click();
    await page.waitForURL(/\/stocks\/BBCA(?:\?|$)/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("BBCA");
    const stockAddress = new URL(page.url());
    stockAddress.searchParams.set("returnTo", `${testClass.path}/measures`);
    await page.goto(stockAddress.href);
    await expect(page.getByRole("link", { name: text.back })).toHaveAttribute(
      "href",
      path,
    );
    const stranger = await newDevice(browser, locale);
    try {
      await signInAsNewLecturer(stranger, "Dosen Lain");
      const response = await stranger.goto(path);
      expect(response?.status()).toBe(404);
      const stockResponse = await stranger.goto(
        `${testClass.path}/stocks/BBCA`,
      );
      expect(stockResponse?.status()).toBe(404);
      await expect(
        stranger.getByRole("heading", { name: text.unavailable }),
      ).toBeVisible();
    } finally {
      await stranger.context().close();
    }
  });
  test(`keeps the market accessible and follows the Peta layout in ${languageNames[locale]}`, async ({
    page,
  }, testInfo) => {
    await chooseLanguage(page, locale);
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { level: 1, name: text.signIn, exact: true }),
    ).toBeVisible();
    await captureScreens(page, testInfo, { screen: "sign-in", locale });
    const testClass = await createMarketClass(page);
    await page.goto(`${testClass.path}/market`);
    await captureScreens(page, testInfo, { screen: "market", locale });
    await page.getByRole("link", { name: /BBCA.*Bank Central Asia/ }).click();
    await page.waitForURL(/\/stocks\/BBCA(?:\?|$)/);
    await captureScreens(page, testInfo, { screen: "stock", locale });
    await expectAccessibleScreen(page);
  });
}

async function captureScreens(
  page: Page,
  testInfo: TestInfo,
  {
    screen,
    locale,
  }: { screen: "market" | "stock" | "sign-in"; locale: Locale },
): Promise<void> {
  for (const width of screenshotWidths(testInfo)) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const problems = await layoutProblems(page);
      expect(problems).toEqual([]);
      if (screen === "market" && testInfo.project.name === "desktop") {
        await expectMarketScales(page);
      }
      await page.screenshot({
        path: testInfo.outputPath(
          `${screen}-${String(width)}-${colorScheme}-${locale}.png`,
        ),
      });
    }
  }
}

async function expectMarketScales(page: Page): Promise<void> {
  for (const column of [5, 6, 7]) {
    const marks = await page
      .locator(
        `main section[aria-labelledby="stocks-heading"] tbody > tr > td:nth-child(${String(column)}) [data-market-reference]`,
      )
      .evaluateAll((ticks) =>
        ticks.map((tick) => ({
          left: tick.getBoundingClientRect().left,
          width: tick.parentElement?.getBoundingClientRect().width,
        })),
      );
    const first = marks[0];
    if (marks.length < 2 || first?.width === undefined) {
      throw new Error(
        `Market column ${String(column)} needs two reference ticks to compare their scales.`,
      );
    }
    expect(first.width).toBeGreaterThan(0);
    for (const mark of marks) {
      expect(mark.left).toBeCloseTo(first.left, 3);
      expect(mark.width).toBeCloseTo(first.width, 3);
    }
  }
}
