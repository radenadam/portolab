import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeLessonPortfolio } from "./store-lesson-portfolio.ts";
import { captureScreens } from "./capture-screens.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectLayout } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";

const texts: Record<
  Locale,
  {
    correlation: string;
    weight: string;
    risk: string;
    price: string;
    limit: string;
    back: string;
    guide: string;
    stock: string;
    full: string;
    close: string;
    skip: string;
    riskAtOne: string;
    riskAtZero: string;
    riskAtMinusOne: string;
    maximumCost: string;
    restore: string;
    tickHelp: string;
    tick: string;
  }
> = {
  id: {
    correlation: "Korelasi ρ",
    weight: "Bobot BBCA",
    risk: "Risiko portofolio",
    price: "Harga acuan",
    limit: "Buka tiket BBCA dengan Limit",
    back: "Kembali ke pelajaran",
    guide: "Cara membaca harga saham",
    stock: "Buka Pasar untuk tugas ini",
    full: "Buka di Belajar",
    close: "Tutup",
    skip: "Langsung ke praktik",
    riskAtOne: "6,06%",
    riskAtZero: "4,32%",
    riskAtMinusOne: "0,83%",
    maximumCost: "Rp 3.004.500",
    restore: "Pakai korelasi asli BBCA dan TLKM, 0,50",
    tickHelp: "Apa itu Fraksi?",
    tick: "Fraksi",
  },
  en: {
    correlation: "Correlation ρ",
    weight: "Weight of BBCA",
    risk: "Portfolio risk",
    price: "Reference price",
    limit: "Open the BBCA ticket with Limit",
    back: "Back to the lesson",
    guide: "How to read a stock price",
    stock: "Open Market for this task",
    full: "Open in Learn",
    close: "Close",
    skip: "Skip to practice",
    riskAtOne: "6.06%",
    riskAtZero: "4.32%",
    riskAtMinusOne: "0.83%",
    maximumCost: "IDR 3,004,500",
    restore: "Use the observed correlation of BBCA and TLKM, 0.50",
    tickHelp: "What is Tick size?",
    tick: "Tick size",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`explores diversification, trading rules, and the price guide in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180_000);
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/2",
      givePortfolio: storeLessonPortfolio,
    });
    try {
      const risk = page
        .locator("main dl")
        .first()
        .locator("div")
        .filter({ has: page.getByText(text.risk, { exact: true }) })
        .locator("dd");
      for (const [rho, expected] of [
        ["1", text.riskAtOne],
        ["0", text.riskAtZero],
        ["-1", text.riskAtMinusOne],
      ] as const) {
        await page
          .getByRole("slider", { name: text.correlation, exact: true })
          .fill(rho);
        await expect(risk).toHaveText(expected);
        await expectMapLabelsClear(page.locator("[data-two-stock-curve]"));
        await expect(
          page.getByRole("button", { name: text.restore, exact: true }),
        ).toBeVisible();
      }
      await page
        .getByRole("slider", { name: text.weight, exact: true })
        .fill("0");
      await page
        .getByRole("slider", { name: text.weight, exact: true })
        .press("Home");
      await page
        .getByRole("slider", { name: text.weight, exact: true })
        .fill("50");
      await expectMapLabelsClear(page.locator("[data-two-stock-curve]"));
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: `lesson-2-${languageNames[locale]}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
      await page.goto(`${classPath}/learn/6`);
      const price = page.getByRole("slider", { name: text.price, exact: true });
      await price.fill("0");
      await expect(
        page.locator("main table").first().locator('tr[data-selected="true"]'),
      ).toHaveCount(1);
      await price.fill("100");
      await expect(
        page.getByText(text.maximumCost, { exact: true }),
      ).toBeVisible();
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: `lesson-6-${languageNames[locale]}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
      await page.goto(`${classPath}/learn/prices`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        text.guide,
      );
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: `price-guide-${languageNames[locale]}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
      await page.getByRole("link", { name: text.stock, exact: true }).click();
      await page.getByRole("link", { name: text.back, exact: true }).click();
      await expect(page).toHaveURL(`${classPath}/learn/prices#practice`);
      await expect(
        page.getByRole("link", { name: text.stock, exact: true }),
      ).toBeInViewport();
    } finally {
      await lecturer.context().close();
    }
  });

  for (const javaScriptEnabled of [false, true]) {
    test.describe(`with JavaScript ${String(javaScriptEnabled)} in ${languageNames[locale]}`, () => {
      test.use({ javaScriptEnabled });
      test("opens Limit from practice and returns to the same lesson section", async ({
        page,
        browser,
      }) => {
        test.setTimeout(120_000);
        const { lecturer, classPath } = await openAsNewStudent(page, browser, {
          locale,
          path: "/learn/6",
        });
        try {
          await page
            .getByRole("link", { name: text.skip, exact: true })
            .click();
          const task = page.getByRole("link", {
            name: text.limit,
            exact: true,
          });
          await expect(task).toBeInViewport();
          await task.click();
          await expect(page).toHaveURL(
            `${classPath}/stocks/BBCA/buy?priceKind=limit&lessonTask=6`,
          );
          await expect(page.locator('input[name="priceKind"]')).toHaveValue(
            "limit",
          );
          await page
            .getByRole("link", { name: text.back, exact: true })
            .click();
          await expect(page).toHaveURL(`${classPath}/learn/6#practice`);
          await expect(task).toBeInViewport();
          await page.goto(`${classPath}/learn/prices`);
          await page
            .getByRole("button", { name: text.tickHelp, exact: true })
            .click();
          const tickHelp = page.getByRole("dialog", {
            name: text.tick,
            exact: true,
          });
          await expect(tickHelp.getByRole("table")).toBeVisible();
          await expectAccessibleScreen(page);
          await expectLayout(page);
          await page.keyboard.press("Escape");
          await expect(tickHelp).not.toBeVisible();
        } finally {
          await lecturer.context().close();
        }
      });
    });
  }

  test(`keeps the server drawing and defaults through hydration in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn",
      givePortfolio: storeLessonPortfolio,
    });
    try {
      await holdClientScripts(
        page,
        { address: classPath + "/learn/2" },
        async (loadClient) => {
          await expect(page.locator("main svg").first()).toBeVisible();
          await expect(page.locator('main input[type="range"]')).toHaveCount(0);
          await expectMapLabelsClear(page.locator("[data-two-stock-curve]"));
          const before = await page.locator("main dl").first().textContent();
          await loadClient();
          await expect(
            page.getByRole("slider", { name: text.correlation, exact: true }),
          ).toBeVisible();
          await expect(page.locator("main dl").first()).toHaveText(
            before ?? "",
          );
        },
      );
    } finally {
      await lecturer.context().close();
    }
  });
  test(`uses the two-stock exercise inside its sheet in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/glossary?q=divers",
      givePortfolio: storeLessonPortfolio,
    });
    try {
      const address = page.url();
      const source = page
        .locator('main a[data-learning-sheet][href*="/learn/2?"]')
        .first();
      await source.click();
      const sheet = page.getByRole("dialog").filter({
        has: page.getByRole("link", { name: text.full, exact: true }),
      });
      await expect(sheet).toBeVisible();
      await sheet
        .getByRole("slider", { name: text.correlation, exact: true })
        .fill("1");
      await expect(
        sheet
          .locator("dl")
          .first()
          .locator("div")
          .filter({ hasText: text.risk })
          .locator("dd"),
      ).toHaveText(text.riskAtOne);
      await expectMapLabelsClear(sheet.locator("[data-two-stock-curve]"));
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: `lesson-2-sheet-${locale}`,
        fullPage: false,
        fromTop: false,
      });
      await sheet.getByRole("link", { name: text.skip, exact: true }).click();
      await expect(sheet.locator('[id$="practice"]')).toBeInViewport();
      await sheet
        .getByRole("button", { name: text.close, exact: true })
        .click();
      await expect(sheet).toHaveCount(0);
      await expect(source).toBeFocused();
      await expect(page).toHaveURL(address);
    } finally {
      await lecturer.context().close();
    }
  });
}
