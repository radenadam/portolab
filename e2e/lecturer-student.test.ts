import { expectAnalysisPanels } from "./expect-analysis-panels.ts";
import { storeActivityOrders } from "./store-activity-orders.ts";
import { expectEndLabelsInsidePlot } from "./expect-end-labels-inside-plot.ts";
import { expectCompactChoice } from "./expect-compact-choice.ts";
import { studentDesignClass } from "./student-design-class.ts";
import type { Browser, Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { reasonMaximumLength } from "../app/features/trading/reason-maximum-length.ts";
import { captureScreens } from "./capture-screens.ts";
import { isPhone } from "./frame.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { selectFirstStudent } from "./select-first-student.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import {
  widestClassNames,
  widestDigitClassNames,
} from "./widest-class-names.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { wideWord } from "./wide-word.ts";

const texts: Record<
  Locale,
  {
    open: string;
    summary: string;
    analysis: string;
    journal: string;
    back: string;
    notice: string;
    sections: string;
    time: string;
    map: string;
    mapTitle: string;
    risk: string;
    prices: string;
    orders: string;
    cancel: string;
    panelJournal: string;
    rejected: string;
    status: string;
    view: string;
    apply: string;
    axis: string;
    applyAxis: string;
    empty: string;
    emptySummary: string;
  }
> = {
  id: {
    open: "Buka portofolio",
    summary: "Ringkasan",
    analysis: "Analisis",
    journal: "Jurnal dan order",
    back: "Kembali ke mahasiswa",
    notice: "Tampilan dosen. Hanya baca.",
    sections: "Bagian portofolio mahasiswa",
    time: "Grafik waktu",
    map: "Peta",
    mapTitle: `Posisi ${widestClassNames.studentName} di peta`,
    risk: "Simpangan baku",
    prices: "Harga 30 Okt 2026, 16.10 WIB.",
    orders: "Order",
    cancel: "Batalkan order",
    panelJournal: "Jurnal alasan",
    rejected: "Ditolak",
    status: "Saring menurut status",
    view: "Tampilan aktivitas",
    apply: "Tampilkan aktivitas",
    axis: "Sumbu risiko",
    applyAxis: "Tampilkan analisis",
    empty: " belum memasang order.",
    emptySummary: `Tidak ada order ${widestClassNames.studentName}. Portofolionya berisi Rp\u00a01.000.000.000.000 kas.`,
  },
  en: {
    open: "Open portfolio",
    summary: "Summary",
    analysis: "Analysis",
    journal: "Journal and orders",
    back: "Back to students",
    notice: "Lecturer view. Read only.",
    sections: "Student portfolio sections",
    time: "Time chart",
    map: "Map",
    mapTitle: `Position of ${widestClassNames.studentName} on the map`,
    risk: "Standard deviation",
    prices: "Prices Oct 30, 2026, 4:10 PM WIB.",
    orders: "Orders",
    cancel: "Cancel order",
    panelJournal: "Reason journal",
    rejected: "Rejected",
    status: "Filter by status",
    view: "Activity view",
    apply: "Show activity",
    axis: "Risk axis",
    applyAxis: "Show analysis",
    empty: " has not placed an order yet.",
    emptySummary: `${widestClassNames.studentName} has no orders. The portfolio holds IDR\u00a01,000,000,000,000 in cash.`,
  },
};
for (const locale of locales) {
  const text = texts[locale];
  test(`opens every read-only student tab and returns to the same selection in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const reason = wideWord("Alasan", reasonMaximumLength);
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestPurchases(classId, {
          ...itmgPortfolio,
          purchases: itmgPortfolio.purchases.map((purchase) => ({
            ...purchase,
            reason,
          })),
        });
      },
    });
    try {
      await page.goto(
        `${classPath}/students?measure=treynor&q=${encodeURIComponent(widestClassNames.studentName)}`,
      );
      await selectFirstStudent(page);
      const selectedAddress = new URL(page.url());
      selectedAddress.hash = "selected-student";
      const selected = selectedAddress.href;
      await page
        .getByRole("dialog")
        .getByRole("link", { name: text.open, exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        widestClassNames.studentName,
      );
      const summary = page.url();
      for (const [tab, suffix] of [
        [text.summary, ""],
        [text.analysis, "/analysis"],
        [text.journal, "/journal"],
      ] as const) {
        const tabs = page.getByRole("navigation", { name: text.sections });
        await tabs.getByRole("link", { name: tab, exact: true }).click();
        const address = new URL(summary);
        address.pathname += suffix;
        await expect(page).toHaveURL(address.href);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          widestClassNames.studentName,
        );
        await expect(
          page.getByText(text.notice, { exact: true }),
        ).toBeVisible();
        await expect(
          tabs.getByRole("link", { name: tab, exact: true }),
        ).toHaveAttribute("aria-current", "page");
        await expect(page.locator('main form[method="post"]')).toHaveCount(0);
        await expectAccessibleScreen(page);
        expect(await layoutProblems(page)).toEqual([]);
        if (suffix === "") {
          await expectSquareMapKeys(page, text.mapTitle);
          await page
            .getByRole("link", { name: text.time, exact: true })
            .click();
          await expect(page).toHaveURL(/view=time/);
          await page.getByRole("link", { name: text.map, exact: true }).click();
        }
        if (suffix === "/analysis") {
          await expectAnalysisPanels(page, locale);
          await expect(
            page.getByRole("main").getByText(text.prices, { exact: true }),
          ).toBeVisible();
          await page.goto(summary);
          await page
            .getByRole("navigation", { name: text.sections })
            .getByRole("link", { name: text.analysis, exact: true })
            .click();
          await page
            .getByRole("link", { name: text.risk, exact: true })
            .click();
          await expect(page).toHaveURL(/axis=risk/);
          await expectAccessibleScreen(page);
        }
        if (suffix === "/journal") {
          await expect(page.locator("blockquote").first()).toHaveText(reason);
          await expect(
            page.getByRole("button", { name: text.cancel }),
          ).toHaveCount(0);
        }
        if (suffix === "/journal" && isPhone())
          await captureStudentScreen(
            page,
            `student-wide-trades-${locale}-journal`,
          );
        await page.getByRole("link", { name: text.back, exact: true }).click();
        await expect(page).toHaveURL(selected);
        await page
          .getByRole("dialog")
          .getByRole("link", { name: text.open, exact: true })
          .click();
      }
      await correctStudentQueries(page, { summary, selected }, text);
      const plain = await newDevice(browser, locale, {
        javaScriptEnabled: false,
        storageState: await page.context().storageState(),
      });
      try {
        await plain.goto(summary);
        for (const tab of [text.analysis, text.journal, text.summary]) {
          await plain
            .getByRole("navigation", { name: text.sections })
            .getByRole("link", { name: tab, exact: true })
            .click();
          await expect(plain.getByRole("heading", { level: 1 })).toHaveText(
            widestClassNames.studentName,
          );
        }
        await plain.getByRole("link", { name: text.back, exact: true }).click();
        await expect(plain).toHaveURL(selected);
      } finally {
        await plain.context().close();
      }
    } finally {
      await student.context().close();
    }
  });
  for (const variant of [
    {
      label: "reference names",
      capture: "student-reference",
      studentName: undefined,
    },
    {
      label: "maximum letter names",
      capture: "student-measured-letters",
      studentName: widestClassNames.studentName,
    },
    {
      label: "maximum digit names",
      capture: "student-measured-digits",
      studentName: widestDigitClassNames.studentName,
    },
  ])
    test(`shows the lecturer's student screens at reference widths with ${variant.label} in ${languageNames[locale]}`, async ({
      page,
      browser,
    }) => {
      const { student, classPath } = await studentDesignClass(page, browser, {
        locale,
        studentName: variant.studentName,
      });
      try {
        await page.goto(`${classPath}/students`);
        await selectFirstStudent(page);
        await page
          .getByRole("dialog")
          .getByRole("link", { name: text.open, exact: true })
          .click();
        if (variant.studentName !== undefined)
          await checkNativeStudentCharts(page, browser, {
            locale,
            studentName: variant.studentName,
          });
        for (const [tab, name] of [
          [text.summary, "summary"],
          [text.analysis, "analysis"],
          [text.journal, "journal"],
        ] as const) {
          await page
            .getByRole("navigation", { name: text.sections })
            .getByRole("link", { name: tab, exact: true })
            .click();
          await expect(
            page
              .getByRole("navigation", { name: text.sections })
              .getByRole("link", { name: tab, exact: true }),
          ).toHaveAttribute("aria-current", "page");
          await captureStudentScreen(
            page,
            `${variant.capture}-${locale}-${name}`,
            {
              studentName: name === "journal" ? undefined : variant.studentName,
              endLabels: name === "analysis",
              compactChoice:
                name === "summary"
                  ? page
                      .getByRole("link", { name: text.time, exact: true })
                      .locator("..")
                  : undefined,
            },
          );
        }
      } finally {
        await student.context().close();
      }
    });
  test(`shows recorded order outcomes without controls that change them in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeActivityOrders,
    });
    try {
      await page.goto(`${classPath}/students`);
      await selectFirstStudent(page);
      await page
        .getByRole("dialog")
        .getByRole("link", { name: text.panelJournal, exact: true })
        .click();
      if (isPhone())
        await page
          .getByRole("link", { name: text.orders, exact: true })
          .click();
      await expect(page.getByRole("button", { name: text.cancel })).toHaveCount(
        0,
      );
      await expect(page.locator('main form[method="post"]')).toHaveCount(0);
      await expect(
        page.getByText(text.rejected, { exact: true }),
      ).toBeVisible();
      await expectAccessibleScreen(page);
      await captureStudentScreen(page, `student-outcomes-${locale}`);
      await page
        .getByRole("navigation", { name: text.status, exact: true })
        .getByRole("link", { name: new RegExp(`^${text.rejected} · `) })
        .click();
      await expect(page).toHaveURL(/view=orders&status=rejected/);
      await expect(
        page.getByText(text.rejected, { exact: true }),
      ).toBeVisible();
    } finally {
      await student.context().close();
    }
  });
  test(`keeps a direct student address selected and shows an empty journal in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    try {
      await page.goto(`${classPath}/students`);
      await selectFirstStudent(page);
      const address = await page
        .getByRole("dialog")
        .getByRole("link", { name: text.open, exact: true })
        .getAttribute("href");
      if (address === null)
        throw new Error("The student has a summary address.");
      const direct = new URL(address, page.url()).pathname;
      await page.goto(direct + "/journal");
      if (isPhone())
        await page
          .getByRole("link", { name: text.orders, exact: true })
          .click();
      await expect(
        page.getByText(widestClassNames.studentName + text.empty, {
          exact: true,
        }),
      ).toBeVisible();
      await page.getByRole("link", { name: text.back, exact: true }).click();
      await expect(page).toHaveURL(/student=\d+#selected-student$/);
      await expect(
        page.getByRole("dialog").getByRole("heading", {
          name: widestClassNames.studentName,
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: text.open, exact: true })
        .click();
      await expect(
        page.getByText(text.emptySummary, { exact: true }),
      ).toBeVisible();
      await expectAccessibleScreen(page);
      await captureStudentScreen(page, `student-empty-${locale}`);
    } finally {
      await student.context().close();
    }
  });
}

async function expectSquareMapKeys(page: Page, title: string): Promise<void> {
  const mapKeys = page
    .getByRole("region", { name: title, exact: true })
    .locator("ul[aria-hidden] > li > span:first-child");
  await expect(mapKeys.first()).toBeVisible();
  for (const key of await mapKeys.all()) {
    const shape = await key.evaluate((element) => {
      const { width, height } = element.getBoundingClientRect();
      return { width, height };
    });
    expect(shape.width).toBeGreaterThan(0);
    expect(shape.width).toBeCloseTo(shape.height, 1);
  }
}

async function correctStudentQueries(
  page: Page,
  { summary, selected }: { summary: string; selected: string },
  text: (typeof texts)[Locale],
): Promise<void> {
  const analysis = new URL(summary);
  analysis.pathname += "/analysis";
  analysis.searchParams.set("axis", "wrong");
  expect((await page.goto(analysis.href))?.status()).toBe(400);
  const axis = page.getByRole("textbox", { name: text.axis, exact: true });
  await expect(axis).toHaveValue("wrong");
  await axis.fill("beta");
  await page.getByRole("button", { name: text.applyAxis, exact: true }).click();
  await expect(page).toHaveURL(/axis=beta/);
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe(
    new URL(summary).searchParams.get("returnTo"),
  );
  const journal = new URL(summary);
  journal.pathname += "/journal";
  journal.searchParams.set("status", "wrong");
  journal.searchParams.set("view", "wrong");
  expect((await page.goto(journal.href))?.status()).toBe(400);
  await page
    .getByRole("combobox", { name: text.status, exact: true })
    .selectOption("all");
  await page
    .getByRole("combobox", { name: text.view, exact: true })
    .selectOption("journal");
  await page.getByRole("button", { name: text.apply, exact: true }).click();
  await expect(page).toHaveURL(/view=journal/);
  await page.getByRole("link", { name: text.back, exact: true }).click();
  await expect(page).toHaveURL(selected);
}

async function expectStudentChartName(
  page: Page,
  studentName: string,
): Promise<void> {
  const label = page
    .locator('[data-map-label="point"]')
    .filter({ hasText: studentName.slice(0, 3) });
  await expect(label).toBeVisible();
  await expect(label).toContainText("…");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(studentName);
  await expect(
    page.getByRole("listitem").filter({ hasText: studentName }).first(),
  ).toBeVisible();
}

async function checkNativeStudentCharts(
  page: Page,
  browser: Browser,
  { locale, studentName }: { locale: Locale; studentName: string },
): Promise<void> {
  const plain = await newDevice(browser, locale, {
    javaScriptEnabled: false,
    sessionFrom: page,
  });
  try {
    await plain.goto(page.url());
    for (const [tab, endLabels] of [
      [texts[locale].summary, false],
      [texts[locale].analysis, true],
    ] as const) {
      await plain
        .getByRole("navigation", { name: texts[locale].sections })
        .getByRole("link", { name: tab, exact: true })
        .click();
      await expectStudentChartName(plain, studentName);
      if (tab === texts[locale].summary)
        await expectCompactChoice(
          plain
            .getByRole("link", { name: texts[locale].time, exact: true })
            .locator(".."),
        );
      expect(await layoutProblems(plain)).toEqual([]);
      await expectEndLabelsInsidePlot(plain, endLabels);
    }
  } finally {
    await plain.context().close();
  }
}

async function captureStudentScreen(
  page: Page,
  name: string,
  {
    studentName,
    endLabels = false,
    compactChoice,
  }: {
    studentName?: string | undefined;
    endLabels?: boolean;
    compactChoice?: Locator | undefined;
  } = {},
): Promise<void> {
  await captureScreens(page, test.info(), {
    name,
    fullPage: true,
    fromTop: true,
    check: async () => {
      if (studentName !== undefined)
        await expectStudentChartName(page, studentName);
      if (compactChoice !== undefined) await expectCompactChoice(compactChoice);
      expect(await layoutProblems(page)).toEqual([]);
      await expectEndLabelsInsidePlot(page, endLabels);
    },
  });
}
