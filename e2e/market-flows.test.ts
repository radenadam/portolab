import { holdClientScripts } from "./hold-client-scripts.ts";
import { captureScreens } from "./capture-screens.ts";
import { expect, test } from "@playwright/test";
import type { Browser, Page, TestInfo } from "@playwright/test";
import { fieldMaximumLength } from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import {
  chosenPassword,
  signInAndReturn,
  signInAsNewLecturer,
} from "./accounts.ts";
import { createMarketClass } from "./create-market-class.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";
import { layoutProblems } from "./expect-layout.ts";
import { expectMarketPriceNotes } from "./expect-market-price-notes.ts";
import { recordedMarketServer } from "./recorded-market-server.ts";

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
    ascending: string;
    financials: string;
    all: string;
    clear: string;
    noResults: string;
    emptySector: string;
    emptySectorChoice: string;
    referenceMarks: string;
    change: string;
    beta: string;
    volatility: string;
    price: string;
    month: string;
    range: string;
    stockRange: string;
    table: string;
    back: string;
    unavailable: string;
    orderError: string;
    noSelection: string;
    sector: string;
  }
> = {
  id: {
    noSelection: "Belum dipilih",
    sector: "Sektor",
    title: "Pasar",
    signIn: "Masuk",
    search: "Cari saham",
    indexHelp: "Apa itu IHSG?",
    calculation: "Lihat perhitungan",
    apply: "Terapkan",
    sort: "Urutkan menurut",
    direction: "Urutan",
    ascending: "Urutkan menaik",
    financials: "Keuangan · 5",
    all: "Semua · 45",
    clear: "Hapus filter",
    noResults:
      'Tidak ada saham LQ45 yang cocok dengan "tidakada" dan sektor yang dipilih. Hapus filter untuk melihat semua saham.',
    emptySector:
      "Sektor yang dipilih tidak memiliki saham dalam daftar LQ45 saat ini. Pilih sektor lain atau hapus filter untuk melihat semua saham.",
    emptySectorChoice: "Properti & Real Estat · 0",
    referenceMarks: "Garis tegak di tabel: IHSG.",
    change: "Perubahan",
    beta: "Beta",
    volatility: "Volatilitas/bln",
    price: "Harga",
    month: "1 bln",
    range: "Rentang grafik IHSG",
    stockRange: "Rentang grafik harga",
    table: "Tabel penutupan harian IHSG",
    back: "Kembali ke Pasar",
    unavailable: "Halaman tidak ditemukan",
    orderError:
      'Kolom "Urutan" berisi "salah", yang bukan pilihan yang tersedia. Pilih Menurun atau Menaik, lalu terapkan lagi.',
  },
  en: {
    noSelection: "No selection",
    sector: "Sector",
    title: "Market",
    signIn: "Sign in",
    search: "Search stocks",
    indexHelp: "What is IHSG?",
    calculation: "View calculation",
    apply: "Apply",
    sort: "Sort by",
    direction: "Order",
    ascending: "Sort ascending",
    financials: "Financials · 5",
    all: "All · 45",
    clear: "Clear filters",
    noResults:
      'No LQ45 stocks match "tidakada" and the chosen sector. Clear filters to see all stocks.',
    emptySector:
      "The chosen sector has no stocks in the current LQ45 list. Choose another sector or clear filters to see all stocks.",
    emptySectorChoice: "Properties & Real Estate · 0",
    referenceMarks: "Vertical ticks in the table mark the IHSG.",
    change: "Change",
    beta: "Beta",
    volatility: "Volatility/month",
    price: "Price",
    month: "1 mo",
    range: "IHSG chart range",
    stockRange: "Price chart range",
    table: "Table of daily IHSG closes",
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
      await withMarketStudent(
        page,
        { browser, locale, javaScriptEnabled },
        async (student, classPath) => {
          await student.goto(`${classPath}/market`);
          const rows = marketRows(student);
          await expect(rows).toHaveCount(45);
          await expectMarketPriceNotes(student, locale, javaScriptEnabled);
          await student.getByLabel(text.search, { exact: true }).fill("INDY");
          if (javaScriptEnabled) {
            await expect(rows).toHaveCount(1);
            await expect(rows.first()).toContainText("INDY");
          }
          await student
            .getByRole("button", { name: text.apply, exact: true })
            .click();
          await expect(student).toHaveURL(/q=INDY/);
          await expect(rows).toHaveCount(1);
          await student
            .getByLabel(text.search, { exact: true })
            .fill("central asia");
          if (javaScriptEnabled) {
            await expect(rows).toHaveCount(1);
            await expect(rows.first()).toContainText("BBCA");
          }
          await student
            .getByRole("button", { name: text.indexHelp, exact: true })
            .click();
          const card = student.getByRole("dialog", {
            name: "IHSG",
            exact: true,
          });
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
            .getByRole("button", { name: text.apply, exact: true })
            .click();
          await expect(student).toHaveURL(
            /sector=financials&sort=code&direction=descending/,
          );
          await student
            .getByRole("link", { name: text.ascending, exact: true })
            .click();
          await expect(student).toHaveURL(
            /sector=financials&sort=code&direction=ascending/,
          );
          await expect(rows).toHaveCount(5);
          await expect(rows.first()).toContainText("BBCA");
          await student
            .getByLabel(text.search, { exact: true })
            .fill("tidakada");
          await student
            .getByRole("button", { name: text.apply, exact: true })
            .click();
          await expect(student).toHaveURL(/q=tidakada/);
          await expect(student.getByText(text.noResults)).toBeVisible();
          await student.getByRole("link", { name: text.clear }).click();
          await expect(rows).toHaveCount(45);
          for (const character of ["x", "9"]) {
            const widestSearch = character.repeat(fieldMaximumLength);
            await student
              .getByLabel(text.search, { exact: true })
              .fill(widestSearch);
            await student
              .getByRole("button", { name: text.apply, exact: true })
              .click();
            await expect(student).toHaveURL(
              (url) => url.searchParams.get("q") === widestSearch,
            );
            await expect(rows).toHaveCount(0);
            await expect(
              student.getByLabel(text.search, { exact: true }),
            ).toHaveValue(widestSearch);
            expect(await layoutProblems(student)).toEqual([]);
          }
          const response = await student.goto(
            `${classPath}/market?direction=salah`,
          );
          expect(response?.status()).toBe(400);
          await expect(student.getByText(text.orderError)).toBeVisible();
          await expect(
            student.getByLabel(text.direction, { exact: true }),
          ).toHaveValue("salah");
          if (javaScriptEnabled) await expectAccessibleScreen(student);
          else expect(await layoutProblems(student)).toEqual([]);
          const widestChoice = "9".repeat(fieldMaximumLength);
          const choiceResponse = await student.goto(
            `${classPath}/market?${new URLSearchParams({ direction: widestChoice }).toString()}`,
          );
          expect(choiceResponse?.status()).toBe(400);
          await expect(
            student.getByLabel(text.direction, { exact: true }),
          ).toHaveValue(widestChoice);
          expect(await layoutProblems(student)).toEqual([]);
        },
      );
    });
    test(`clears an empty sector from a recorded market in ${languageNames[locale]} with JavaScript ${String(javaScriptEnabled)}`, async ({
      browser,
    }, testInfo) => {
      const server = await recordedMarketServer(
        new Date("2026-11-17T16:59:59.999Z"),
      );
      try {
        const student = await newDevice(browser, locale, {
          siteUrl: server.url,
          javaScriptEnabled,
        });
        try {
          await student.goto(server.classPath);
          await signInAndReturn(student, {
            path: server.classPath,
            username: server.studentUsername,
            password: chosenPassword,
          });
          const address = `${server.url}${server.classPath}/market?sector=propertiesAndRealEstate`;
          if (javaScriptEnabled) {
            await holdClientScripts(
              student,
              { address },
              async (loadClient) => {
                await expectEmptySector(student, text);
                await loadClient();
                await expectEmptySector(student, text);
              },
            );
            await expectAccessibleScreen(student);
            await captureScreens(student, testInfo, {
              name: `market-empty-${locale}`,
              fromTop: true,
              fullPage: true,
              check: async () => {
                expect(await layoutProblems(student)).toEqual([]);
              },
            });
          } else {
            const response = await student.goto(address);
            expect(response?.status()).toBe(200);
            await expectEmptySector(student, text);
            expect(await layoutProblems(student)).toEqual([]);
          }
          await student
            .getByRole("link", { name: text.clear, exact: true })
            .click();
          await expect(marketRows(student)).toHaveCount(45);
          await expect(
            student.getByRole("radio", { name: text.all, exact: true }),
          ).toBeChecked();
          await expect(
            student.getByText(text.emptySector, { exact: true }),
          ).toHaveCount(0);
        } finally {
          await student.context().close();
        }
      } finally {
        await server.stop();
      }
    });

    test(`quotes empty market choices as their visible labels in ${languageNames[locale]} with JavaScript ${String(javaScriptEnabled)}`, async ({
      page,
      browser,
    }) => {
      await withMarketStudent(
        page,
        { browser, locale, javaScriptEnabled },
        async (student, classPath) => {
          for (const [name, label] of [
            ["sector", text.sector],
            ["sort", text.sort],
            ["direction", text.direction],
            ["range", text.range],
          ] as const) {
            for (const value of ["", " \t "]) {
              const response = await student.goto(
                `${classPath}/market?${new URLSearchParams({ [name]: value }).toString()}`,
              );
              expect(response?.status()).toBe(400);
              if (name === "sector")
                await expect(
                  student.getByRole("radio", {
                    name: text.noSelection,
                    exact: true,
                  }),
                ).toBeChecked();
              else {
                const control = student.getByRole("combobox", {
                  name: label,
                  exact: true,
                });
                await expect(control).toHaveValue(value);
                await expect(control.locator("option:checked")).toHaveText(
                  text.noSelection,
                );
              }
              const failure = student.locator(`#${name}-failure`);
              await expect(failure).toContainText(`"${label}"`);
              await expect(failure).toContainText(`"${text.noSelection}"`);
              expect(await layoutProblems(student)).toEqual([]);
            }
          }
          if (javaScriptEnabled) await expectAccessibleScreen(student);
        },
      );
    });
  }
  test(`keeps native market filters and help when JavaScript loads in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const testClass = await createMarketClass(page);
    await page.goto(`${testClass.path}/market`);
    await holdClientScripts(page, {}, async (loadClient) => {
      await expect(page.getByRole("slider")).toHaveCount(0);
      await page.getByLabel(text.search, { exact: true }).fill("central asia");
      await page
        .getByRole("radio", { name: text.financials, exact: true })
        .check();
      await page.getByLabel(text.sort, { exact: true }).selectOption("code");
      await page
        .getByRole("button", { name: text.indexHelp, exact: true })
        .click();
      const card = page.getByRole("dialog", { name: "IHSG", exact: true });
      await card.getByText(text.calculation, { exact: true }).click();
      await expect(card.locator("details[open]")).toBeVisible();
      await loadClient();
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
        page.getByRole("link", { name: text.ascending, exact: true }),
      ).toBeVisible();
      await expect(marketRows(page)).toHaveCount(1);
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
      expect(destination.searchParams.get("direction")).toBe("descending");
    });
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
    stockAddress.searchParams.set("returnTo", `${testClass.path}/analysis`);
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
    await captureMarketScreens(page, testInfo, { screen: "sign-in", locale });
    const testClass = await createMarketClass(page);
    await page.goto(`${testClass.path}/market`);
    await captureMarketScreens(page, testInfo, { screen: "market", locale });
    await page.locator("#market-measure-notes").click();
    await captureMarketScreens(page, testInfo, {
      screen: "market-notes",
      locale,
    });
    await page.locator("#market-measure-notes").click();
    await page.getByRole("link", { name: /BBCA.*Bank Central Asia/ }).click();
    await page.waitForURL(/\/stocks\/BBCA(?:\?|$)/);
    await captureMarketScreens(page, testInfo, { screen: "stock", locale });
    await expectAccessibleScreen(page);
  });
}

function marketRows(page: Page) {
  return page.locator("main section[aria-labelledby=stocks-heading] tbody tr");
}

async function expectEmptySector(
  page: Page,
  text: { emptySectorChoice: string; emptySector: string },
): Promise<void> {
  await expect(
    page.getByRole("radio", { name: text.emptySectorChoice, exact: true }),
  ).toBeChecked();
  await expect(marketRows(page)).toHaveCount(0);
  await expect(page.getByText(text.emptySector, { exact: true })).toBeVisible();
}

async function withMarketStudent(
  page: Page,
  {
    browser,
    locale,
    javaScriptEnabled,
  }: { browser: Browser; locale: Locale; javaScriptEnabled: boolean },
  use: (student: Page, classPath: string) => Promise<void>,
): Promise<void> {
  await chooseLanguage(page, locale);
  const testClass = await createMarketClass(page);
  const student = await newDevice(browser, locale, {
    javaScriptEnabled,
    locale: "tr-TR",
  });
  try {
    await signInAsTestStudent(student, testClass, "Mahasiswa Pasar");
    await use(student, testClass.path);
  } finally {
    await student.context().close();
  }
}

async function captureMarketScreens(
  page: Page,
  testInfo: TestInfo,
  {
    screen,
    locale,
  }: {
    screen: "market" | "market-notes" | "stock" | "sign-in";
    locale: Locale;
  },
): Promise<void> {
  await captureScreens(page, testInfo, {
    name: `${screen}-${locale}`,
    fromTop: true,
    fullPage: true,
    check: async () => {
      expect(await layoutProblems(page)).toEqual([]);
      const market = screen === "market" || screen === "market-notes";
      if (market && testInfo.project.name === "desktop") {
        await expectMarketScales(page, locale);
      }
      if (market) {
        await expectMarketHeaders(
          page,
          locale,
          testInfo.project.name === "phone",
        );
      }
    },
  });
}

async function expectMarketHeaders(
  page: Page,
  locale: Locale,
  isPhone: boolean,
): Promise<void> {
  const table = page.locator('section[aria-labelledby="stocks-heading"]');
  await expect(
    table.getByRole("columnheader", { name: texts[locale].price, exact: true }),
  ).toHaveCount(1);
  await expect(table.getByRole("columnheader")).toHaveCount(isPhone ? 5 : 8);
  await expect(
    page.getByText(texts[locale].referenceMarks, { exact: true }),
  ).toBeVisible({ visible: !isPhone });
}

async function expectMarketScales(page: Page, locale: Locale): Promise<void> {
  const table = page.locator('section[aria-labelledby="stocks-heading"]');
  for (const [label, measure] of [
    [texts[locale].change, false],
    [texts[locale].beta, true],
    [texts[locale].volatility, true],
  ] as const) {
    const column = await table
      .getByRole("columnheader")
      .filter({ hasText: label })
      .evaluate((cell) => {
        if (!(cell instanceof HTMLTableCellElement))
          throw new Error("The market column has no table header cell.");
        return cell.cellIndex + 1;
      });
    const cells = table.locator(`tbody > tr > td:nth-child(${String(column)})`);
    const marks = await cells
      .locator("[data-market-reference]")
      .evaluateAll((ticks) =>
        ticks.map((tick) => ({
          left: tick.getBoundingClientRect().left,
          width: tick.parentElement?.getBoundingClientRect().width,
        })),
      );
    const first = marks[0];
    if (marks.length < 2 || first?.width === undefined) {
      throw new Error(
        `Market column "${label}" needs two reference ticks to compare its scales.`,
      );
    }
    expect(first.width).toBeGreaterThan(0);
    for (const mark of marks) {
      expect(mark.left).toBeCloseTo(first.left, 3);
      expect(mark.width).toBeCloseTo(first.width, 3);
    }
    if (measure) {
      const edges = await cells
        .locator("[data-market-value]")
        .evaluateAll((values) =>
          values.map((value) => value.getBoundingClientRect().right),
        );
      expect(edges.length).toBeGreaterThan(marks.length);
      for (const edge of edges) expect(edge).toBeCloseTo(edges[0] ?? 0, 3);
    }
  }
}
