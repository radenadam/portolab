import { expectAnalysisPanels } from "./expect-analysis-panels.ts";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { captureScreens } from "./capture-screens.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectLayout } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { newDevice } from "./new-device.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeTestHolding } from "./store-test-holding.ts";

const texts: Record<
  Locale,
  {
    allocation: string;
    allocationConcept: string;
    group: string;
    stock: string;
    sector: string;
    cell: string;
    pair: string;
    reverseCell: string;
    reversePair: string;
    risk: string;
    calculate: string;
    cash: string;
    cashLabel: string;
    weights: readonly string[];
    correlationEnds: readonly [string, string];
    weightLesson: string;
    weightLessonTitle: string;
    references: readonly { title: string; lesson: string; term: string }[];
    help: (title: string) => string;
  }
> = {
  id: {
    allocation: "Alokasi",
    allocationConcept: "Bobot",
    cashLabel: "Kas",
    group: "Kelompokkan alokasi",
    stock: "Saham",
    sector: "Sektor",
    cell: "BBCA dan TLKM: korelasi 0,50. Lihat perhitungan.",
    pair: "Korelasi BBCA dan TLKM",
    reverseCell: "TLKM dan BBCA: korelasi 0,50. Lihat perhitungan.",
    reversePair: "Korelasi TLKM dan BBCA",
    risk: "Kontribusi risiko BBCA",
    calculate: "Lihat perhitungan",
    cash: "Kas 20,0% tidak menyumbang risiko.",
    weights: ["50,0%", "30,0%", "20,0%"],
    correlationEnds: ["-1,00", "+1,00"],
    weightLesson: "Pelajari lebih lanjut di sesi 10",
    weightLessonTitle: "Imbal hasil dan risiko portofolio",
    references: [
      {
        title: "Bobot sektor",
        lesson: "Pelajari lebih lanjut di sesi 2",
        term: "bobot-sektor",
      },
      {
        title: "Korelasi",
        lesson: "Pelajari lebih lanjut di sesi 2",
        term: "korelasi",
      },
      {
        title: "Kontribusi risiko",
        lesson: "Pelajari lebih lanjut di sesi 10",
        term: "kontribusi-risiko",
      },
    ],
    help: (title) => `Apa itu ${title}?`,
  },
  en: {
    allocation: "Allocation",
    allocationConcept: "Weight",
    cashLabel: "Cash",
    group: "Group allocation",
    stock: "Stock",
    sector: "Sector",
    cell: "BBCA and TLKM: correlation 0.50. View calculation.",
    pair: "Correlation of BBCA and TLKM",
    reverseCell: "TLKM and BBCA: correlation 0.50. View calculation.",
    reversePair: "Correlation of TLKM and BBCA",
    risk: "Risk contribution of BBCA",
    calculate: "View calculation",
    cash: "Cash of 20.0% contributes no risk.",
    weights: ["50.0%", "30.0%", "20.0%"],
    correlationEnds: ["-1.00", "+1.00"],
    weightLesson: "Learn more in session 10",
    weightLessonTitle: "Portfolio return and risk",
    references: [
      {
        title: "Sector weight",
        lesson: "Learn more in session 2",
        term: "bobot-sektor",
      },
      {
        title: "Correlation",
        lesson: "Learn more in session 2",
        term: "korelasi",
      },
      {
        title: "Risk contribution",
        lesson: "Learn more in session 10",
        term: "kontribusi-risiko",
      },
    ],
    help: (title) => `What is ${title}?`,
  },
};

function givePortfolio(classId: ClassId): void {
  // Python Decimal expectations for these recorded values are in analysis-extras.test.tsx.
  storeTestHolding(
    classId,
    {
      code: "BBCA",
      shares: shares(5_500),
      cost: rupiah(27_431_085),
      cash: rupiah(10_956_000),
    },
    [{ code: "TLKM", shares: shares(8_300), cost: rupiah(16_458_651) }],
  );
}

for (const locale of locales) {
  const text = texts[locale];
  test(`opens allocation, correlation, and risk calculations in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, info) => {
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/analysis",
      givePortfolio,
    });
    try {
      await expectAnalysisPanels(page, locale);
      const allocation = page.getByRole("region", {
        name: text.allocation,
        exact: true,
      });
      await expect(
        allocation.locator('[data-layout="rows"] strong'),
      ).toHaveText(text.weights);
      await allocation
        .getByRole("link", { name: text.stock, exact: true })
        .click();
      await expect(page).toHaveURL(`${classPath}/analysis?allocation=stock`);
      await expect(
        allocation.locator('[data-layout="rows"] > div > span'),
      ).toHaveText(["BBCA", "TLKM", text.cashLabel]);
      await allocation
        .getByRole("button", {
          name: text.help(text.allocationConcept),
          exact: true,
        })
        .click();
      const help = page.getByRole("dialog", {
        name: text.allocationConcept,
        exact: true,
      });
      await help.getByText(text.calculate, { exact: true }).click();
      await expect(help.getByRole("table")).toBeVisible();
      await expect(help.locator('a[href$="#term-bobot"]')).toBeVisible();
      await expectLayout(page);
      await expect(page.getByRole("slider").first()).toBeVisible();
      await help
        .getByRole("link", { name: text.weightLesson, exact: true })
        .click();
      const lesson = page.getByRole("dialog", {
        name: text.weightLessonTitle,
        exact: true,
      });
      await expect(lesson).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(lesson).toBeHidden();
      await expect(
        allocation.getByRole("link", { name: text.stock, exact: true }),
      ).toHaveAttribute("aria-current", "true");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: text.cell, exact: true }).click();
      const pair = page.getByRole("dialog", { name: text.pair, exact: true });
      await expect(pair).toContainText("CORREL");
      await expectLayout(page);
      await page.keyboard.press("Escape");
      await page.locator('button[popovertarget="analysis-risk-BBCA"]').click();
      const risk = page.getByRole("dialog", { name: text.risk, exact: true });
      await expect(risk).toContainText("SUMPRODUCT");
      await expectLayout(page);
      await page.keyboard.press("Escape");
      await expect(page.getByText(text.cash, { exact: true })).toBeVisible();
      await allocation
        .getByRole("link", { name: text.sector, exact: true })
        .click();
      for (const reference of text.references) {
        await page
          .getByRole("button", {
            name: text.help(reference.title),
            exact: true,
          })
          .click();
        const card = page.getByRole("dialog", {
          name: reference.title,
          exact: true,
        });
        await expect(
          card.getByRole("link", { name: reference.lesson, exact: true }),
        ).toBeVisible();
        await expect(
          card.locator(`a[href$="#term-${reference.term}"]`),
        ).toBeVisible();
        await page.keyboard.press("Escape");
      }
      await expectCorrelationContrast(page, text.correlationEnds);
      await captureScreens(page, info, {
        name: `analysis-extras-${locale}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
    } finally {
      await lecturer.context().close();
    }
  });

  test(`changes the allocation in place once JavaScript runs, and returns to it through the fragment before, in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/analysis",
      givePortfolio,
    });
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      await page.waitForFunction(() => "__reactRouterDataRouter" in window);
      const allocation = page.getByRole("region", {
        name: text.allocation,
        exact: true,
      });
      const choice = allocation.getByRole("link", {
        name: text.stock,
        exact: true,
      });
      await choice.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => ({
        scroll: window.scrollY,
        entries: history.length,
      }));
      await choice.click();
      // A choice of a view changes the part in place: the address loses the fragment, the scroll stays, and the history keeps one entry for the screen.
      await expect(page).toHaveURL(`${classPath}/analysis?allocation=stock`);
      await expect(choice).toHaveAttribute("aria-current", "true");
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeCloseTo(before.scroll, 0);
      expect(await page.evaluate(() => history.length)).toBe(before.entries);

      await plain.goto(`${classPath}/analysis`);
      await plain
        .getByRole("region", { name: text.allocation, exact: true })
        .getByRole("link", { name: text.stock, exact: true })
        .click();
      await expect(plain).toHaveURL(
        `${classPath}/analysis?allocation=stock#analysis-allocation`,
      );
      await expect(
        plain.getByRole("region", { name: text.allocation, exact: true }),
      ).toBeInViewport();
    } finally {
      await plain.context().close();
      await lecturer.context().close();
    }
  });

  test(`keeps native analysis calculations and allocation through hydration in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/analysis",
      givePortfolio,
    });
    try {
      await holdClientScripts(
        page,
        { address: `${classPath}/analysis?allocation=stock` },
        async (loadClient) => {
          const allocation = page.getByRole("region", {
            name: text.allocation,
            exact: true,
          });
          await expect(
            allocation.getByRole("link", { name: text.stock, exact: true }),
          ).toHaveAttribute("aria-current", "true");
          await page
            .getByRole("button", { name: text.cell, exact: true })
            .click();
          const pair = page.getByRole("dialog", {
            name: text.pair,
            exact: true,
          });
          await expect(pair).toBeVisible();
          await page.keyboard.press("Escape");
          await page
            .getByRole("button", { name: text.reverseCell, exact: true })
            .click();
          const reverse = page.getByRole("dialog", {
            name: text.reversePair,
            exact: true,
          });
          await expect(reverse).toBeVisible();
          await loadClient();
          await expect(reverse).toBeVisible();
          await page.keyboard.press("Escape");
          await allocation
            .getByRole("link", { name: text.sector, exact: true })
            .click();
          await expect(
            allocation.getByRole("link", { name: text.sector, exact: true }),
          ).toHaveAttribute("aria-current", "true");
        },
      );
    } finally {
      await lecturer.context().close();
    }
  });
}

async function expectCorrelationContrast(
  page: Page,
  values: readonly [string, string],
): Promise<void> {
  // Recorded holdings do not reach perfect correlations, so the scale endpoints need contrast checks of their own.
  await page.evaluate((ends) => {
    const legend = document.querySelector('[style*="--correlation-negative"]');
    if (!(legend instanceof HTMLElement))
      throw new Error("The correlation scale has no endpoint colors.");
    const samples = document.createElement("div");
    samples.id = "correlation-contrast";
    for (const [property, value] of [
      ["--correlation-negative", ends[0]],
      ["--correlation-positive", ends[1]],
    ] as const) {
      const sample = document.createElement("span");
      sample.style.cssText =
        "display:inline-block;padding:var(--space-3);font-family:var(--font-code);font-size:var(--text-small);color:var(--color-ink)";
      sample.style.backgroundColor = legend.style.getPropertyValue(property);
      sample.textContent = value;
      samples.append(sample);
    }
    const main = document.querySelector("main");
    if (main === null)
      throw new Error(
        "The correlation contrast samples need the page's main content.",
      );
    main.append(samples);
  }, values);
  try {
    await expectAccessibleScreen(page);
  } finally {
    await page.locator("#correlation-contrast").evaluate((element) => {
      element.remove();
    });
  }
}
