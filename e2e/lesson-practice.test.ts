import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { captureScreens } from "./capture-screens.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";

const texts: Record<
  Locale,
  {
    beta: string;
    show: string;
    reset: string;
    formula: string;
    covariance: string;
    skip: string;
    task: string;
    back: string;
    buy: string;
    lots: string;
    submit: string;
    own: string;
    example: string;
    done: string;
    failed: string;
    capmResult: string;
    cash: string;
    afterCash: string;
    noValue: string;
  }
> = {
  id: {
    beta: "Beta",
    noValue: "Tidak ada",
    show: "Tampilkan saham Anda dan alphanya",
    reset: "Kembalikan",
    formula: "Apa itu CAPM dan garis pasar sekuritas?",
    covariance: "Dari mana varians berasal",
    skip: "Langsung ke praktik",
    task: "Cari saham pertama Anda",
    back: "Kembali ke pelajaran",
    buy: "Beli",
    lots: "Jumlah lot",
    submit: "Pasang order",
    own: "Angka Anda",
    example:
      "Contoh dengan saham yang memiliki cukup imbal hasil bulanan. Bobot contoh tidak mengubah portofolio Anda.",
    done: "Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.",
    failed: "Belum tercapai.",
    capmResult: "= 0,046% per bulan",
    cash: "Kas 20,00%. Kas tidak berisiko dan tidak berbunga.",
    afterCash: "Kas 70,00%. Kas tidak berisiko dan tidak berbunga.",
  },
  en: {
    beta: "Beta",
    noValue: "None",
    show: "Show your stocks and their alpha",
    reset: "Reset",
    formula: "What is CAPM and the security market line?",
    covariance: "Where variance comes from",
    skip: "Skip to practice",
    task: "Find your first stock",
    back: "Back to the lesson",
    buy: "Buy",
    lots: "Lots",
    submit: "Place the order",
    own: "Your numbers",
    example:
      "An example using stocks with enough monthly returns. Example weights do not change your portfolio.",
    done: "Achieved. Observe what also happens to expected return.",
    failed: "Not achieved yet.",
    capmResult: "= 0.046% per month",
    cash: "Cash 20.00%. Cash has no risk and earns no interest.",
    afterCash: "Cash 70.00%. Cash has no risk and earns no interest.",
  },
};

function storeLessonPortfolio(classId: ClassId): void {
  // Recorded quotes and costs match measures-for-test.server.ts. Cash and current values give weights 0.5, 0.3, and 0.2.
  storeTestHolding(
    classId,
    {
      code: "BBCA",
      cash: rupiah(10_956_000),
      shares: shares(5500),
      cost: rupiah(27_431_085),
    },
    [{ code: "TLKM", shares: shares(8300), cost: rupiah(16_458_651) }],
  );
}

for (const locale of locales) {
  const text = texts[locale];
  test(`practises CAPM and allocation with the student's stocks in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/9",
      givePortfolio: storeLessonPortfolio,
    });
    const classPath = new URL(page.url()).pathname.replace(/\/learn\/9$/u, "");
    const beta = page.getByRole("slider", { name: text.beta, exact: true });
    await expect(beta).toHaveValue("0.6");
    await expectAccessibleScreen(page);
    expect(await layoutProblems(page)).toEqual([]);
    await captureScreens(page, testInfo, {
      name: `lesson-9-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await beta.focus();
    await beta.press("Home");
    await beta.press("ArrowRight");
    await expect(beta).toHaveValue("0.05");
    await beta.press("End");
    await expect(beta).toHaveValue("2");
    await beta.fill("1");
    // Python Decimal gives the market expected return 0.00045684092205129883 at beta 1.
    await expect(
      page.getByText(text.capmResult, { exact: true }),
    ).toBeVisible();
    await page.getByRole("checkbox", { name: text.show }).uncheck();
    await expect(
      page.locator("main svg text").filter({ hasText: /^BBCA$/u }),
    ).toHaveCount(0);
    await page.getByRole("checkbox", { name: text.show }).check();
    await page.getByRole("button", { name: /TLKM.*(?:Buka|Open)/u }).click();
    await expect(page.locator("#lesson-alpha-TLKM:popover-open")).toBeVisible();
    await expectAccessibleScreen(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: text.formula, exact: true }).click();
    await expect(
      page.getByRole("dialog").filter({ hasText: "BI-Rate" }),
    ).toBeVisible();
    await expectAccessibleScreen(page);
    await page.keyboard.press("Escape");
    await expect(beta).toHaveValue("1");
    await page.getByRole("link", { name: text.skip }).click();
    await expect(page).toHaveURL(`${classPath}/learn/9#practice`);
    await page.goto(`${classPath}/learn/10`);
    await expect(page.getByText(text.cash, { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(text.failed);
    await captureScreens(page, testInfo, {
      name: `lesson-10-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await page.getByRole("slider", { name: "BBCA", exact: true }).fill("0");
    await expect(page.getByText(text.afterCash, { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(text.done);
    await page.getByText(text.covariance, { exact: true }).click();
    await expect(page.locator("main details[open]")).toContainText("ρ");
    await expectAccessibleScreen(page);
    expect(await layoutProblems(page)).toEqual([]);
    await captureScreens(page, testInfo, {
      name: `lesson-10-changed-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await page.getByRole("button", { name: text.reset, exact: true }).click();
    await expect(
      page.getByRole("slider", { name: "BBCA", exact: true }),
    ).toHaveValue("50");
    await expect(page.getByText(text.cash, { exact: true })).toBeVisible();
    await page.getByRole("slider", { name: "BBCA", exact: true }).fill("100");
    await expect(
      page.getByRole("slider", { name: "BBCA", exact: true }),
    ).toHaveValue("70");
    for (const code of ["BBCA", "TLKM"])
      await page.getByRole("slider", { name: code, exact: true }).fill("0");
    await expect(page.locator("main")).toContainText(text.noValue);
    await expectAccessibleScreen(page);
    expect(await layoutProblems(page)).toEqual([]);
    await lecturer.context().close();
  });

  test(`keeps native help open through hydration in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/9",
      givePortfolio: storeLessonPortfolio,
    });
    await holdClientScripts(
      page,
      { otherDevice: lecturer.context() },
      async (loadClient) => {
        await expect(page.locator('input[type="range"]')).toHaveCount(0);
        await expect(page.locator("main svg").first()).toBeVisible();
        await page
          .getByRole("button", { name: /TLKM.*(?:Buka|Open)/u })
          .click();
        await expect(
          page.locator("#lesson-alpha-TLKM:popover-open"),
        ).toBeVisible();
        await loadClient();
        await expect(
          page.locator("#lesson-alpha-TLKM:popover-open"),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("slider", { name: text.beta, exact: true }),
        ).toHaveValue("0.6");
      },
    );
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });
    test("opens the first-stock task and returns to the same practice", async ({
      page,
      browser,
    }, testInfo) => {
      test.setTimeout(120_000);
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "/learn/9",
      });
      const classPath = new URL(page.url()).pathname.replace(
        /\/learn\/9$/u,
        "",
      );
      for (const session of [9, 10]) {
        await page.goto(`${classPath}/learn/${String(session)}`);
        await page.getByRole("link", { name: text.skip }).click();
        if (session === 10)
          await expect(
            page.getByText(text.example, { exact: true }),
          ).toBeVisible();
        await page.getByRole("link", { name: text.task, exact: true }).click();
        await expect(page).toHaveURL(
          `${classPath}/market?lessonTask=${String(session)}`,
        );
        if (session === 9)
          await captureScreens(page, testInfo, {
            name: `lesson-task-market-${locale}`,
            fullPage: false,
            fromTop: true,
          });
        await page.locator('main a[href*="/stocks/BBCA?"]').click();
        await expect(
          page.getByRole("link", { name: text.back, exact: true }),
        ).toBeVisible();
        if (session === 9)
          await captureScreens(page, testInfo, {
            name: `lesson-task-stock-${locale}`,
            fullPage: true,
            fromTop: true,
          });
        await page.getByRole("link", { name: text.buy, exact: true }).click();
        await expect(page).toHaveURL(
          new RegExp(`lessonTask=${String(session)}`, "u"),
        );
        if (session === 10) {
          await page
            .getByRole("textbox", { name: text.lots, exact: true })
            .fill("1");
          await page
            .getByRole("button", { name: text.submit, exact: true })
            .click();
          await expect(page).toHaveURL(
            /\/activity\?placed=\d+&lessonTask=10$/u,
          );
        }
        await page.getByRole("link", { name: text.back, exact: true }).click();
        await expect(page).toHaveURL(
          `${classPath}/learn/${String(session)}#practice`,
        );
      }
      await lecturer.context().close();
    });
  });
}
