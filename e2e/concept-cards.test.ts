import { holdClientScripts } from "./hold-client-scripts.ts";
import { screenshotWidths } from "./screenshot-widths.ts";
import { expect, test } from "@playwright/test";
import type { Browser, Locator, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { openSimulationCard } from "./frame.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeTestHolding } from "./store-test-holding.ts";

const texts: Record<
  Locale,
  {
    calculation: string;
    example: string;
    lesson: string;
    beta: string;
    help: (title: string) => string;
    cards: readonly (readonly [string, string, string])[];
  }
> = {
  id: {
    calculation: "Lihat perhitungan",
    example: "Angka pada halaman ini",
    lesson:
      "Pelajari lebih lanjut di sesi 9. Pelajaran belum tersedia di Portolab.",
    beta: "Beta terhadap IHSG",
    help: (title) => `Apa itu ${title}?`,
    cards: [
      ["Imbal hasil yang diharapkan", "-0,05%", "SUMPRODUCT"],
      ["Simpangan baku", "2,59%", "√0,0006732"],
      ["Beta terhadap IHSG", "0,34", "SUMPRODUCT"],
      ["Rasio Sharpe", "-0,20", "(-0,05% − 0,48%) / 2,59%"],
      ["Rasio Treynor", "-1,55%", "(-0,05% − 0,48%) / 0,34"],
      ["Alpha Jensen", "-0,38%", "-0,05% − 0,33%"],
      ["Imbal hasil yang diharapkan IHSG", "0,05%", "AVERAGE"],
      ["Suku bunga bebas risiko", "0,48%", "5,75% / 12"],
    ],
  },
  en: {
    calculation: "View calculation",
    example: "Value on this page",
    lesson:
      "Learn more in session 9. The lesson is not available in Portolab yet.",
    beta: "Beta against the IHSG",
    help: (title) => `What is ${title}?`,
    cards: [
      ["Expected return", "-0.05%", "SUMPRODUCT"],
      ["Standard deviation", "2.59%", "√0.0006732"],
      ["Beta against the IHSG", "0.34", "SUMPRODUCT"],
      ["Sharpe ratio", "-0.20", "(-0.05% − 0.48%) / 2.59%"],
      ["Treynor ratio", "-1.55%", "(-0.05% − 0.48%) / 0.34"],
      ["Jensen's alpha", "-0.38%", "-0.05% − 0.33%"],
      ["Expected return of the IHSG", "0.05%", "AVERAGE"],
      ["Risk-free rate", "0.48%", "5.75% / 12"],
    ],
  },
};

function openConceptPage(
  page: Page,
  browser: Browser,
  { locale, path }: { locale: Locale; path: string },
): Promise<{ lecturer: Page }> {
  return openAsNewStudent(page, browser, {
    locale,
    path,
    givePortfolio: (classId) => {
      storeTestHolding(classId, bbcaHolding);
    },
  });
}

async function openConcept(
  page: Page,
  locale: Locale,
  title: string,
): Promise<Locator> {
  await page
    .getByRole("button", { name: texts[locale].help(title), exact: true })
    .click();
  const card = page.getByRole("dialog", { name: title, exact: true });
  await expect(card).toBeVisible();
  return card;
}

async function openCalculation(
  card: Locator,
  locale: Locale,
): Promise<Locator> {
  const calculation = card.locator(":scope > div > details");
  if ((await calculation.getAttribute("open")) === null) {
    await calculation
      .getByText(texts[locale].calculation, { exact: true })
      .click();
  }
  await expect(calculation).toHaveAttribute("open", "");
  return calculation;
}

async function expectBetaCalculation(card: Locator): Promise<void> {
  const formula = card.locator(":scope > div > details > div > p");
  await expect(formula).toHaveText("βp = Σ wi βi (SUMPRODUCT)");
  const lines = await formula.evaluate(
    (element) =>
      element.getBoundingClientRect().height /
      Number.parseFloat(getComputedStyle(element).lineHeight),
  );
  expect(lines).toBeLessThanOrEqual(2);
  await expect(card.locator("thead th")).toHaveCount(3);
}

// A popover can extend past the left edge without increasing the width of the document.
async function expectCardInsideScreen(
  page: Page,
  card: Locator,
): Promise<void> {
  await expect
    .poll(async () => {
      const box = await card.boundingBox();
      const viewport = page.viewportSize();
      if (box === null || viewport === null) {
        throw new Error("The concept card has no visible box or viewport.");
      }
      return {
        left: Math.min(0, box.x),
        right: Math.max(0, box.x + box.width - viewport.width),
        top: Math.min(0, box.y),
        bottom: Math.max(0, box.y + box.height - viewport.height),
      };
    })
    .toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
}

for (const locale of locales) {
  const text = texts[locale];

  test(`opens the concepts with the student's numbers, expands their calculations, and returns focus with Escape in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openConceptPage(page, browser, {
      locale,
      path: "/measures",
    });
    for (const [title, value, formula] of text.cards) {
      const card = await openConcept(page, locale, title);
      await expect(card).toContainText(text.example);
      await expect(card.locator(":scope > div > div").first()).toContainText(
        value,
      );
      const calculation = await openCalculation(card, locale);
      await expect(calculation).toContainText(formula);
      await expectCardInsideScreen(page, card);
      await expect(card.locator('a[href*="/learn/"]')).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(card).toBeHidden();
      await expect(
        page.getByRole("button", { name: text.help(title), exact: true }),
      ).toBeFocused();
    }
    const card = await openConcept(page, locale, text.beta);
    await expect(card).toContainText(text.lesson);
    await openCalculation(card, locale);
    await expectBetaCalculation(card);
    await expectAccessibleScreen(page);
    for (const width of screenshotWidths(test.info())) {
      await page.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        await page.screenshot({
          path: test
            .info()
            .outputPath(`beta-${String(width)}-${colorScheme}.png`),
        });
      }
    }
    // The frame persists on a client navigation, so its card must close when the page changes.
    await page.keyboard.press("Escape");
    const simulation = await openSimulationCard(page);
    const stockLink = page
      .getByRole("main")
      .getByRole("link", { name: "BBCA", exact: true })
      .first();
    await stockLink.focus();
    await page.keyboard.press("Enter");
    await expect(simulation).toBeHidden();
    await lecturer.context().close();
  });

  test(`keeps an open concept and its calculation when JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openConceptPage(page, browser, {
      locale,
      path: "/measures",
    });
    const scripts = await holdClientScripts(page);
    try {
      await scripts.reloadNativePage();
      const address = page.url();
      const card = await openConcept(page, locale, text.beta);
      const calculation = await openCalculation(card, locale);
      await expectBetaCalculation(card);

      await scripts.release();
      await expect(page.getByRole("slider").first()).toBeVisible();
      await expect(card).toBeVisible();
      await expect(calculation).toHaveAttribute("open", "");
      await expect(page).toHaveURL(address);
    } finally {
      await scripts.dispose();
      await lecturer.context().close();
    }
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });

    test("opens a concept and its calculation without losing the current page", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openConceptPage(page, browser, {
        locale,
        path: "/portfolio",
      });
      const address = page.url();
      const card = await openConcept(page, locale, text.beta);
      await openCalculation(card, locale);
      await expectBetaCalculation(card);
      await expectCardInsideScreen(page, card);
      await page.keyboard.press("Escape");
      await expect(card).toBeHidden();
      await expect(page).toHaveURL(address);
      await lecturer.context().close();
    });
  });
}
