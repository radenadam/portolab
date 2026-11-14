import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { isPhone } from "./frame.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { tokenColor } from "./token-color.ts";

const texts: Record<
  Locale,
  {
    heading: string;
    title: string;
    value: string;
    chart: string;
    lead: string;
    holdings: string;
    table: string;
    analysis: string;
    cash: string;
    noHoldings: string;
    home: string;
    activity: string;
    navigation: string;
    row: readonly string[];
    latest: string;
  }
> = {
  id: {
    heading: "Beranda",
    title: `Beranda di ${widestClassNames.className}`,
    value: "Rp 996.063.812.500",
    chart: "Sejak 26 Okt",
    lead: "Unggul 5,88 poin dari IHSG",
    holdings: "Saham Anda · 1",
    table: "Imbal hasil pada setiap penutupan",
    analysis: "Analisis",
    cash: "Rp 124.563.812.500",
    noHoldings: "Anda tidak memegang saham.",
    home: "Beranda",
    activity: "Aktivitas",
    navigation: "Navigasi utama",
    row: ["Rp 871.500.000.000", "▼ -Rp 3.936.187.500", "▼ -0,45%", "87,49%"],
    latest: "30 Okt 2026: Portofolio Anda 0,00% dan IHSG -5,88%",
  },
  en: {
    heading: "Home",
    title: `Home in ${widestClassNames.className}`,
    value: "IDR 996,063,812,500",
    chart: "Since Oct 26",
    lead: "Ahead of the IHSG by 5.88 points",
    holdings: "Your holding · 1",
    table: "The return at each close",
    analysis: "Analysis",
    cash: "IDR 124,563,812,500",
    noHoldings: "You hold no shares.",
    home: "Home",
    activity: "Activity",
    navigation: "Main navigation",
    row: ["IDR 871,500,000,000", "▼ -IDR 3,936,187,500", "▼ -0.45%", "87.49%"],
    latest: "Oct 30, 2026: Your portfolio 0.00% and IHSG -5.88%",
  },
};

function holdingRow(page: Page) {
  return page
    .getByRole("main")
    .getByRole(isPhone() ? "listitem" : "row")
    .filter({ hasText: "ITMG" })
    .filter({ has: page.getByRole("link") });
}

for (const locale of locales) {
  const text = texts[locale];
  test(`shows Beranda at the class home with its cash and navigation in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await expect(student).toHaveURL(classPath);
    await expect(student).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      student.getByRole("heading", {
        level: 1,
        name: text.heading,
        exact: true,
      }),
    ).toBeAttached();
    await expect(student.getByRole("main")).toContainText(text.noHoldings);
    await expectAccessibleScreen(student);
    const navigation = student.getByRole("navigation", {
      name: text.navigation,
    });
    await expect(
      navigation.getByRole("link", { name: text.home, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await navigation
      .getByRole("link", { name: text.activity, exact: true })
      .click();
    await navigation
      .getByRole("link", { name: text.home, exact: true })
      .click();
    await expect(student).toHaveURL(classPath);
    const response = await student.goto(`${classPath}/portfolio`);
    expect(response?.status()).toBe(404);
    await student.context().close();
  });

  test(`values holdings and cash against independent amounts and opens the return chart and analysis in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeTestPurchases(classId, itmgPortfolio);
    await student.reload();
    const main = student.getByRole("main");
    // Python Decimal computed the cash, cost, and delayed valuation in itmg-portfolio.ts. Independently, 871500000000 / 996063812500 = 87.4943923532%, which rounds to 87.49%.
    await expect(main.getByText(text.value, { exact: true })).toBeVisible();
    await expect(
      main.getByText(text.cash, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: text.holdings }),
    ).toBeVisible();
    await expect(main.getByText(text.lead, { exact: true })).toBeVisible();
    const row = holdingRow(student);
    for (const value of text.row) await expect(row).toContainText(value);
    const chart = main.getByRole("slider", { name: text.chart, exact: true });
    await expect(chart).toHaveAttribute("aria-valuetext", text.latest);
    await chart.focus();
    await student.keyboard.press("Home");
    await expect(chart).toHaveAttribute("aria-valuenow", "0");
    await student.keyboard.press("End");
    await expect(chart).toHaveAttribute("aria-valuetext", text.latest);
    await student.keyboard.press("Escape");
    await main.getByText(text.table, { exact: true }).click();
    await expect(
      main
        .locator("details")
        .filter({ has: student.getByText(text.table, { exact: true }) })
        .locator("tbody tr"),
    ).toHaveCount(5);
    await expectAccessibleScreen(student);
    for (const colorScheme of ["light", "dark"] as const) {
      await student.emulateMedia({ colorScheme });
      const palette = {
        rise: [await tokenColor(student, "--color-gain")],
        fall: [
          await tokenColor(student, "--color-loss"),
          await tokenColor(student, "--color-loss-on-soft"),
        ],
      };
      expect(
        await main.evaluate((element, colors) => {
          const problems: string[] = [];
          for (const change of element.querySelectorAll("[data-change]")) {
            const direction = change.getAttribute("data-change");
            if (direction === "none" || change.getClientRects().length === 0)
              continue;
            const expected = direction === "rise" ? colors.rise : colors.fall;
            if (!expected.includes(getComputedStyle(change).color))
              problems.push(change.textContent);
          }
          return problems;
        }, palette),
      ).toEqual([]);
    }
    await main.getByRole("link", { name: text.analysis, exact: true }).click();
    await expect(student).toHaveURL(`${classPath}/measures`);
    await student.context().close();
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });
    test("draws the chart and holdings and follows stock links", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "",
        givePortfolio: (classId) => {
          storeTestPurchases(classId, itmgPortfolio);
        },
      });
      const main = page.getByRole("main");
      await expect(main.getByText(text.value, { exact: true })).toBeVisible();
      await expect(main.getByRole("slider")).toHaveCount(0);
      await expect(main.locator("svg").first()).toBeVisible();
      await main.getByText(text.table, { exact: true }).click();
      await expect(main.getByRole("table").first()).toBeVisible();
      await expect(holdingRow(page).getByRole("link")).toHaveAttribute(
        "href",
        /\/stocks\/ITMG$/,
      );
      await holdingRow(page).getByRole("link").click();
      await expect(page).toHaveURL(/\/stocks\/ITMG$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "ITMG",
      );
      await lecturer.context().close();
    });
  });
}
