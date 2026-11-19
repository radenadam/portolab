import { expect, test } from "@playwright/test";
import { locales, type Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeLessonPortfolio } from "./store-lesson-portfolio.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectLayout } from "./expect-layout.ts";
import { captureScreens } from "./capture-screens.ts";

const texts: Record<
  Locale,
  {
    values: readonly string[];
    own: string;
    show: string;
    sentence: string;
    formulas: readonly string[];
  }
> = {
  id: {
    show: "Tampilkan saham Anda dan alphanya",
    values: [
      "-0,00%",
      "0,00%",
      "0,00",
      "-3.166.112.493,86",
      "-23.692.559.215,10%",
      "▼ -0,48%",
    ],
    own: "Angka Anda",
    sentence:
      "Imbal hasil harapan -0,00%, risiko 0,00%, Sharpe -3.166.112.493,86, dan Treynor -23.692.559.215,10% per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    formulas: [
      "Sp=E(Rp)−Rfσp=-0,00000000001207%−0,48%0,0000000001513%",
      "Tp=E(Rp)−Rfβp=-0,00000000001207%−0,48%0,00000000002022",
    ],
  },
  en: {
    show: "Show your stock and its alpha",
    values: [
      "-0.00%",
      "0.00%",
      "0.00",
      "-3,166,112,493.86",
      "-23,692,559,215.10%",
      "▼ -0.48%",
    ],
    own: "Your numbers",
    sentence:
      "Expected return is -0.00%, risk 0.00%, Sharpe -3,166,112,493.86, and Treynor -23,692,559,215.10% per month. The sliders start at your current portfolio weights.",
    formulas: [
      "Sp=E(Rp)−Rfσp=-0.00000000001207%−0.48%0.0000000001513%",
      "Tp=E(Rp)−Rfβp=-0.00000000001207%−0.48%0.00000000002022",
    ],
  },
};

for (const locale of locales) {
  test(`keeps ratios of one lot at the largest portfolio value inside the lesson in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const text = texts[locale];
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/10",
      givePortfolio: (classId) => {
        storeLessonPortfolio(classId, "minimum");
      },
    });
    try {
      // Python Decimal used the independently computed TLKM mean, variance, and beta of measure-portfolio.test.ts at weight 198000 / 9007199254740991. It gives risk 1.513422747e-12, beta 2.022435239e-11, Sharpe -3166112493.859045, and Treynor -23692559215.102925%.
      await expect(
        page.locator("main dl").first().locator("dd > [data-number]"),
      ).toHaveText(text.values);
      await expect(
        page
          .getByRole("region", { name: text.own, exact: true })
          .locator("p")
          .first(),
      ).toHaveText(text.sentence);
      for (const formula of text.formulas)
        await expect(
          page.getByText(formula, { exact: true }).first(),
        ).toBeVisible();
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: `lesson-10-minimum-${locale}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
      await page.goto(`${classPath}/learn/9`);
      await expect(
        page.getByRole("checkbox", { name: text.show, exact: true }),
      ).toBeChecked();
    } finally {
      await lecturer.context().close();
    }
  });
}
