import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { storeLessonPortfolio } from "./store-lesson-portfolio.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectLayout } from "./expect-layout.ts";
import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { captureScreens } from "./capture-screens.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";

const practiceSessions = [
  { session: 9, query: "CAPM" },
  { session: 10, query: "Sharpe" },
] as const;

const texts: Record<
  Locale,
  {
    beta: string;
    own: string;
    capmNumbers: readonly string[];
    riskNumbers: readonly string[];
    currentValues: readonly string[];
    tinyTask: string;
    raisedTask: string;
    tinyFormulas: readonly string[];
    show: string;
    reset: string;
    formula: string;
    covariance: string;
    skip: string;
    task: string;
    back: string;
    buy: string;
    lots: string;
    activity: string;
    example: string;
    apply: string;
    clear: string;
    done: string;
    failed: string;
    capmResult: string;
    cash: string;
    afterCash: string;
    noValue: string;
    fractionalCash: string;
    changedFractionalCash: string;
    full: string;
    openPractice: string;
    mapAlpha: string;
  }
> = {
  id: {
    mapAlpha: "Lihat perhitungan TLKM",
    openPractice: "Kerjakan di halaman pelajaran",
    full: "Buka di Belajar",
    apply: "Terapkan",
    clear: "Hapus filter",
    currentValues: [
      "sekarang -0,22%",
      "sekarang 4,07%",
      "sekarang 0,62",
      "sekarang -0,17",
      "sekarang -1,12%",
      "sekarang ▼ -0,43%",
    ],
    own: "Angka Anda",
    tinyFormulas: [
      "Sp = (E(Rp) − Rf) / σp = (-0,00001182% − 0,48%) / 0,0002227%",
      "Tp = (E(Rp) − Rf) / βp = (-0,00001182% − 0,48%) / 0,000034",
    ],
    tinyTask:
      "Tugas. Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 0,00%.",
    raisedTask:
      "Tugas. Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 0,05%.",
    capmNumbers: ["0,62", "0,21%", "-0,22%"],
    riskNumbers: ["-0,22%", "4,07%", "-0,17", "-1,12%"],
    beta: "Beta",
    noValue: "Tidak ada",
    fractionalCash: "Kas 30,40%. Kas tidak berisiko dan tidak berbunga.",
    changedFractionalCash: "Kas 29,40%. Kas tidak berisiko dan tidak berbunga.",
    show: "Tampilkan saham Anda dan alphanya",
    reset: "Kembalikan",
    formula: "Apa itu CAPM dan garis pasar sekuritas?",
    covariance: "Dari mana varians berasal",
    skip: "Langsung ke praktik",
    task: "Cari saham pertama Anda",
    back: "Kembali ke pelajaran",
    buy: "Beli",
    lots: "Jumlah lot",
    activity: "Lihat di Aktivitas",
    example:
      "Contoh dari imbal hasil bulanan saham yang tersimpan. Bobot contoh tidak mengubah portofolio Anda.",
    done: "Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.",
    failed: "Belum tercapai.",
    capmResult: "= 0,046% per bulan",
    cash: "Kas 20,00%. Kas tidak berisiko dan tidak berbunga.",
    afterCash: "Kas 70,00%. Kas tidak berisiko dan tidak berbunga.",
  },
  en: {
    mapAlpha: "See the calculation of TLKM",
    openPractice: "Work on the lesson page",
    full: "Open in Learn",
    apply: "Apply",
    clear: "Clear filters",
    currentValues: [
      "current -0.22%",
      "current 4.07%",
      "current 0.62",
      "current -0.17",
      "current -1.12%",
      "current ▼ -0.43%",
    ],
    own: "Your numbers",
    tinyFormulas: [
      "Sp = (E(Rp) − Rf) / σp = (-0.00001182% − 0.48%) / 0.0002227%",
      "Tp = (E(Rp) − Rf) / βp = (-0.00001182% − 0.48%) / 0.000034",
    ],
    tinyTask:
      "Task. Use the sliders above to raise portfolio risk above 0.01%. It is now 0.00%.",
    raisedTask:
      "Task. Use the sliders above to raise portfolio risk above 0.01%. It is now 0.05%.",
    capmNumbers: ["0.62", "0.21%", "-0.22%"],
    riskNumbers: ["-0.22%", "4.07%", "-0.17", "-1.12%"],
    beta: "Beta",
    noValue: "None",
    fractionalCash: "Cash 30.40%. Cash has no risk and earns no interest.",
    changedFractionalCash:
      "Cash 29.40%. Cash has no risk and earns no interest.",
    show: "Show your stocks and their alpha",
    reset: "Reset",
    formula: "What is CAPM and the security market line?",
    covariance: "Where variance comes from",
    skip: "Skip to practice",
    task: "Find your first stock",
    back: "Back to the lesson",
    buy: "Buy",
    lots: "Lots",
    activity: "View in Activity",
    example:
      "An example from stored monthly stock returns. Example weights do not change your portfolio.",
    done: "Achieved. Observe what also happens to expected return.",
    failed: "Not achieved yet.",
    capmResult: "= 0.046% per month",
    cash: "Cash 20.00%. Cash has no risk and earns no interest.",
    afterCash: "Cash 70.00%. Cash has no risk and earns no interest.",
  },
};

function practiceProgress(page: Page): Locator {
  return page.locator("#practice").getByRole("status");
}

function lessonMap(page: Page): Locator {
  return page.locator("main svg:has([data-map-label])").first();
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
    await expect(
      page
        .getByRole("region", { name: text.own, exact: true })
        .locator("strong"),
    ).toHaveText([text.own, ...text.capmNumbers]);
    await expectAccessibleScreen(page);
    await expectLayout(page);
    await captureScreens(page, testInfo, {
      name: `lesson-9-${locale}`,
      fullPage: true,
      fromTop: true,
      check: () => expectMapLabelsClear(lessonMap(page)),
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
    await expectMapLabelsClear(lessonMap(page));
    await page.getByRole("checkbox", { name: text.show }).uncheck();
    await expect(
      page.locator("main svg text").filter({ hasText: /^BBCA$/u }),
    ).toHaveCount(0);
    await page.getByRole("checkbox", { name: text.show }).check();
    const mapAlpha = page.getByRole("button", {
      name: text.mapAlpha,
      exact: true,
    });
    await mapAlpha.focus();
    await mapAlpha.press("Enter");
    const mapCalculation = page.locator("#map-lesson-alpha-TLKM:popover-open");
    await expect(mapCalculation).toBeInViewport();
    await expectAccessibleScreen(page);
    await captureScreens(page, testInfo, {
      name: `lesson-9-alpha-${locale}`,
      fullPage: false,
      fromTop: false,
      check: async () => {
        await expect(mapCalculation).toBeInViewport();
      },
    });
    await page.keyboard.press("Escape");
    await expect(mapAlpha).toBeFocused();
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
    await expect(
      page
        .getByRole("region", { name: text.own, exact: true })
        .locator("strong"),
    ).toHaveText([text.own, ...text.riskNumbers]);
    await expect(practiceProgress(page)).toHaveText(text.failed);
    await expect(page.locator("main dl small")).toHaveText(text.currentValues);
    await captureScreens(page, testInfo, {
      name: `lesson-10-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await page.getByRole("slider", { name: "BBCA", exact: true }).fill("0");
    await expect(page.getByText(text.afterCash, { exact: true })).toBeVisible();
    await expect(practiceProgress(page)).toHaveText(text.done);
    await expect(page.locator("main dl small")).toHaveText(text.currentValues);
    await page.getByText(text.covariance, { exact: true }).click();
    await expect(page.locator("main details[open]")).toContainText("ρ");
    await expectAccessibleScreen(page);
    await expectLayout(page);
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
    await expectLayout(page);
    await lecturer.context().close();
  });

  test(`keeps fractional server weights through hydration and a keyboard step in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/10",
      givePortfolio: (classId) => {
        storeLessonPortfolio(classId, "fractional");
      },
    });
    await holdClientScripts(
      page,
      { otherDevice: lecturer.context() },
      async (loadClient) => {
        await expect(page.locator('input[type="range"]')).toHaveCount(0);
        await expect(
          page.getByText(text.fractionalCash, { exact: true }),
        ).toBeVisible();
        await loadClient();
        const weight = page.getByRole("slider", { name: "BBCA", exact: true });
        await expect(weight).toHaveValue("49.8");
        await expect(
          page.getByRole("slider", { name: "TLKM", exact: true }),
        ).toHaveValue("19.8");
        await weight.press("ArrowRight");
        await expect(weight).toHaveValue("50.8");
        await expect(
          page.getByText(text.changedFractionalCash, { exact: true }),
        ).toBeVisible();
      },
    );
    await lecturer.context().close();
  });

  test(`gives small holdings beside cash a visible risk task in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn/10",
      givePortfolio: (classId) => {
        storeLessonPortfolio(classId, "tiny");
      },
    });
    await expect(page.getByText(text.tinyTask, { exact: true })).toBeVisible();
    await expect(practiceProgress(page)).toHaveText(text.failed);
    for (const formula of text.tinyFormulas)
      await expect(
        page.getByText(formula, { exact: true }).first(),
      ).toBeVisible();
    await captureScreens(page, testInfo, {
      name: `lesson-10-tiny-default-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await page
      .getByRole("slider", { name: "BBCA", exact: true })
      .press("ArrowRight");
    // Python Decimal gives risk 0.0524723% after the weight of BBCA rises by one percentage point.
    await expect(
      page.getByText(text.raisedTask, { exact: true }),
    ).toBeVisible();
    await expect(practiceProgress(page)).toHaveText(text.done);
    await expectAccessibleScreen(page);
    await expectLayout(page);
    await captureScreens(page, testInfo, {
      name: `lesson-10-tiny-${locale}`,
      fullPage: true,
      fromTop: true,
    });
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
        await expectMapLabelsClear(lessonMap(page));
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
        await expectMapLabelsClear(lessonMap(page));
      },
    );
  });

  for (const { session, query } of practiceSessions) {
    test(`keeps lesson ${String(session)} without holdings accessible before and after hydration in ${languageNames[locale]}`, async ({
      page,
      browser,
    }) => {
      const { lecturer, classPath } = await openAsNewStudent(page, browser, {
        locale,
        path: `/learn/${String(session)}`,
      });
      await holdClientScripts(
        page,
        { otherDevice: lecturer.context() },
        async (loadClient) => {
          await expectAccessibleScreen(page);
          await loadClient();
          await expect(page.getByRole("slider").first()).toBeVisible();
          await expectAccessibleScreen(page);
        },
      );
      await page.goto(`${classPath}/glossary?q=${query}`);
      await page
        .locator(`main a[href*="/learn/${String(session)}?"]`)
        .first()
        .click();
      const sheet = page.getByRole("dialog").filter({
        has: page.getByRole("link", { name: text.full, exact: true }),
      });
      await sheet
        .getByRole("link", { name: text.openPractice, exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/learn/${String(session)}\\?returnTo=.+#practice$`, "u"),
      );
      await expect(
        page.getByRole("link", { name: text.task, exact: true }),
      ).toBeInViewport();
    });
  }

  test(`uses the exercises inside lesson sheets in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { lecturer, classPath } = await openAsNewStudent(page, browser, {
      locale,
      path: "/glossary",
      givePortfolio: storeLessonPortfolio,
    });
    try {
      for (const { session, query } of practiceSessions) {
        await page.goto(`${classPath}/glossary?q=${query}`);
        const address = page.url();
        const source = page
          .locator(`main a[href*="/learn/${String(session)}?"]`)
          .first();
        await source.click();
        const lesson = page.getByRole("dialog").filter({
          has: page.getByRole("link", { name: text.full, exact: true }),
        });
        await expect(lesson).toBeVisible();
        await expect(lesson.getByRole("slider").first()).toBeVisible();
        if (session === 9) {
          await lesson
            .getByRole("slider", { name: text.beta, exact: true })
            .fill("1");
          await expect(
            lesson.getByText(text.capmResult, { exact: true }),
          ).toBeVisible();
          const mapAlpha = lesson.getByRole("button", {
            name: text.mapAlpha,
            exact: true,
          });
          await mapAlpha.focus();
          await mapAlpha.press("Enter");
          await expect(
            lesson.locator('[id$="map-lesson-alpha-TLKM"]:popover-open'),
          ).toBeInViewport();
          await page.keyboard.press("Escape");
          await expect(mapAlpha).toBeFocused();
          await lesson
            .getByRole("button", { name: /TLKM.*(?:Buka|Open)/u })
            .click();
          await expect(
            lesson.locator('[id$="lesson-alpha-TLKM"]:popover-open'),
          ).toBeVisible();
          await page.keyboard.press("Escape");
        } else {
          await lesson
            .getByRole("slider", { name: "BBCA", exact: true })
            .fill("0");
          await expect(
            lesson.getByText(text.afterCash, { exact: true }),
          ).toBeVisible();
        }
        await expectAccessibleScreen(page);
        await captureScreens(page, testInfo, {
          name: `lesson-sheet-${String(session)}-${locale}`,
          fullPage: false,
          fromTop: false,
        });
        await lesson
          .getByRole("link", { name: text.skip, exact: true })
          .click();
        await expect(lesson.locator('[id$="practice"]')).toBeInViewport();
        await expect(page).toHaveURL(address);
        await page.keyboard.press("Escape");
        await expect(lesson).toHaveCount(0);
        await expect(source).toBeFocused();
      }
    } finally {
      await lecturer.context().close();
    }
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
      const backLink = page.getByRole("link", {
        name: text.back,
        exact: true,
      });
      const checkTaskBanner = async (): Promise<void> => {
        await expect(backLink.locator("svg")).toBeVisible();
      };
      for (const { session } of practiceSessions) {
        await page.goto(`${classPath}/learn/${String(session)}`);
        await page.getByRole("link", { name: text.skip }).click();
        if (session === 10) {
          await expect(
            page.getByText(text.example, { exact: true }),
          ).toBeVisible();
          await expect(page.locator("main dl small")).toHaveCount(0);
        }
        const taskLink = page.getByRole("link", {
          name: text.task,
          exact: true,
        });
        await captureScreens(page, testInfo, {
          name: `lesson-empty-${String(session)}-${locale}`,
          fullPage: true,
          fromTop: true,
          check: async () => {
            await expectLayout(page);
            await expect(taskLink.locator("svg")).toBeVisible();
          },
        });
        await taskLink.click();
        await expect(page).toHaveURL(
          `${classPath}/market?lessonTask=${String(session)}`,
        );
        if (session === 9)
          await captureScreens(page, testInfo, {
            name: `lesson-task-market-${locale}`,
            fullPage: true,
            fromTop: true,
            check: checkTaskBanner,
          });
        await page.locator("#market-search").fill("no matching company");
        await page
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await page.getByRole("link", { name: text.clear, exact: true }).click();
        await expect(page.locator("#market-search")).toHaveValue("");
        await page.locator("#market-search").fill("BBCA");
        await page
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await page.locator('main a[href*="range=1y"]').click();
        const filtered = new URL(page.url());
        expect(filtered.pathname).toBe(`${classPath}/market`);
        expect(filtered.searchParams.get("q")).toBe("BBCA");
        expect(filtered.searchParams.get("range")).toBe("1y");
        expect(filtered.searchParams.get("lessonTask")).toBe(String(session));
        await page.locator('main a[href*="/stocks/BBCA?"]').click();
        await checkTaskBanner();
        if (session === 9)
          await captureScreens(page, testInfo, {
            name: `lesson-task-stock-${locale}`,
            fullPage: true,
            fromTop: true,
            check: checkTaskBanner,
          });
        await page.getByRole("link", { name: text.buy, exact: true }).click();
        await expect(page).toHaveURL(
          new RegExp(`lessonTask=${String(session)}`, "u"),
        );
        if (session === 9)
          await captureScreens(page, testInfo, {
            name: `lesson-task-ticket-${locale}`,
            fullPage: testInfo.project.name !== "phone",
            fromTop: false,
            check: checkTaskBanner,
          });
        if (session === 10) {
          await page
            .getByRole("textbox", { name: text.lots, exact: true })
            .fill("1");
          await page
            .getByRole("button", { name: new RegExp(`^${text.buy} `, "u") })
            .click();
          await page
            .getByRole("link", { name: text.activity, exact: true })
            .click();
          await expect(page).toHaveURL(`${classPath}/activity?lessonTask=10`);
          await page.locator('main a[href*="status=waiting"]').click();
          await expect(page).toHaveURL(
            `${classPath}/activity?status=waiting&lessonTask=10`,
          );
          await captureScreens(page, testInfo, {
            name: `lesson-task-activity-${locale}`,
            fullPage: true,
            fromTop: true,
            check: checkTaskBanner,
          });
        }
        await backLink.click();
        await expect(page).toHaveURL(
          `${classPath}/learn/${String(session)}#practice`,
        );
        await expect(taskLink).toBeVisible();
        await expect(taskLink).toBeInViewport();
      }
      await lecturer.context().close();
    });
  });
}
