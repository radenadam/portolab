import { impactAfterValue } from "./trade-impact-rows.ts";
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { captureScreens } from "./capture-screens.ts";
import { expectCompactChoice } from "./expect-compact-choice.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { layoutProblems } from "./expect-layout.ts";
import { returnFromLesson } from "./return-from-lesson.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

const texts: Record<
  Locale,
  {
    title: string;
    summary: string;
    analysis: string;
    activity: string;
    body: string;
    valueTitle: string;
    value: string;
    emptyValue: string;
    impactWeight: string;
    lots: string;
    lotsHelp: string;
    prices: string;
    changed: string;
    sell: string;
    data: string;
    backToAnalysis: string;
    measures: string;
    calculate: string;
    reason: string;
    waiting: string;
    activityLink: string;
    cancel: string;
    confirm: string;
    journal: string;
    notFound: string;
    axis: string;
    apply: string;
    map: string;
    time: string;
    learn: string;
    portfolioLesson: string;
    tradingLesson: string;
    more: string;
    back: string;
  }
> = {
  id: {
    title: "Portofolio demonstrasi",
    summary: "Ringkasan",
    analysis: "Analisis",
    activity: "Aktivitas",
    body: "Portofolio Anda sendiri untuk peragaan di kelas, dengan modal awal Rp 1.000.000.000.000 seperti mahasiswa. Portofolio ini tidak dihitung dalam statistik, peta, atau peringkat kelas, dan mahasiswa tidak melihatnya.",
    valueTitle: "Nilai portofolio",
    value: "Rp 999.253.000.000",
    emptyValue: "Rp 1.000.000.000.000",
    impactWeight: "49,8%",
    lots: "Jumlah lot",
    lotsHelp: "Apa itu Jumlah lot?",
    prices: "Waktu harga: Portofolio demonstrasi",
    changed:
      "Total order berubah dari pratinjau yang Anda lihat. Periksa rincian biaya, lalu konfirmasi lagi.",
    sell: "Jual",
    data: "Data dan metode",
    backToAnalysis: "Kembali ke Analisis",
    measures: "Ukuran portofolio Anda",
    calculate: "Lihat perhitungan",
    reason: "Alasan (opsional)",
    waiting: "Order menunggu",
    activityLink: "Lihat di Aktivitas",
    cancel: "Batalkan order",
    confirm: "Ya, batalkan",
    journal: "Jurnal",
    notFound: "Halaman tidak ditemukan",
    axis: "Sumbu risiko",
    apply: "Tampilkan analisis",
    map: "Peta",
    time: "Grafik waktu",
    learn: "Pelajari",
    portfolioLesson: "CAPM dan garis pasar sekuritas",
    tradingLesson: "Mekanisme perdagangan",
    more: "Pelajari lebih lanjut di sesi 6",
    back: "Kembali ke halaman sebelumnya",
  },
  en: {
    title: "Demonstration portfolio",
    summary: "Summary",
    analysis: "Analysis",
    activity: "Activity",
    body: "Your own portfolio for demonstrations in class, with starting cash of IDR 1,000,000,000,000 like the students. This portfolio is excluded from class statistics, maps, and rankings, and students cannot see it.",
    valueTitle: "Portfolio value",
    value: "IDR 999,253,000,000",
    emptyValue: "IDR 1,000,000,000,000",
    impactWeight: "49.8%",
    lots: "Lots",
    lotsHelp: "What is Lots?",
    prices: "Price times: Demonstration portfolio",
    changed:
      "The order total changed from the preview you saw. Check the cost breakdown, then confirm again.",
    sell: "Sell",
    data: "Data and method",
    backToAnalysis: "Back to Analysis",
    measures: "Your portfolio measures",
    calculate: "View calculation",
    reason: "Reason (optional)",
    waiting: "Order waiting",
    activityLink: "View in Activity",
    cancel: "Cancel order",
    confirm: "Yes, cancel",
    journal: "Journal",
    notFound: "Page not found",
    axis: "Risk axis",
    apply: "Show analysis",
    map: "Map",
    time: "Time chart",
    learn: "Learn",
    portfolioLesson: "CAPM and the security market line",
    tradingLesson: "The mechanism of trading",
    more: "Learn more in session 6",
    back: "Back to the previous page",
  },
};

async function visitLessonAndReturn(
  source: Locator,
  {
    title,
    back,
    address,
    javaScriptEnabled,
  }: {
    title: string;
    back: string;
    address: string;
    javaScriptEnabled: boolean;
  },
): Promise<void> {
  const page = source.page();
  const sourceId = await source.getAttribute("id");
  await source.click();
  if (!javaScriptEnabled) {
    if (sourceId === null)
      throw new Error("The native lesson source has no return anchor.");
    const returnAddress = new URL(address);
    returnAddress.hash = sourceId;
    await returnFromLesson(page, {
      lesson: title,
      back,
      address: returnAddress.href,
      source,
    });
    const sourceTop = await source.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    const bannerBottom = await page
      .getByRole("banner")
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(sourceTop).toBeGreaterThanOrEqual(bannerBottom);
    return;
  }
  const lesson = page.getByRole("dialog", { name: title, exact: true });
  await expect(lesson).toBeVisible();
  await expect(page).toHaveURL(address);
  await page.keyboard.press("Escape");
  await expect(lesson).toHaveCount(0);
  await expect(source).toBeFocused();
}

async function confirmOrderAndOpenActivity(
  ticket: Locator,
  {
    javaScriptEnabled,
    changed,
    total,
    waiting,
    activity,
  }: {
    javaScriptEnabled: boolean;
    changed: string;
    total: string;
    waiting: string;
    activity: { label: string; path: string };
  },
): Promise<void> {
  await ticket.locator('button[type="submit"]').click();
  if (!javaScriptEnabled) {
    await expect(ticket.getByText(changed, { exact: true })).toBeVisible();
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(total);
    await ticket.locator('button[type="submit"]').click();
  }
  await expect(
    ticket.getByRole("heading", { name: waiting, exact: true }),
  ).toBeVisible();
  await ticket.getByRole("link", { name: activity.label, exact: true }).click();
  await expect(ticket.page()).toHaveURL(activity.path);
}

function storeComparedPortfolios(classId: ClassId): void {
  // Python Decimal gives 24,937,350,000 per maximum order at the recorded BBCA close of 2 November 2026. Twenty orders cost 498,747,000,000, and thirty cost 748,120,500,000. Each owner starts with one trillion rupiah.
  for (const portfolio of [
    {
      demonstration: true,
      count: 20,
      cash: rupiah(501_253_000_000),
      shares: shares(100_000_000),
      cost: rupiah(498_747_000_000),
      reason: "Demonstration thesis.",
    },
    {
      demonstration: false,
      count: 30,
      cash: rupiah(251_879_500_000),
      shares: shares(150_000_000),
      cost: rupiah(748_120_500_000),
      reason: "Student thesis.",
    },
  ]) {
    storeTestPurchases(classId, {
      demonstration: portfolio.demonstration,
      joinedAt: new Date("2026-10-26T10:00:00Z"),
      cash: portfolio.cash,
      holding: { code: "BBCA", shares: portfolio.shares, cost: portfolio.cost },
      purchases: Array.from({ length: portfolio.count }, () => ({
        code: "BBCA",
        lots: 50_000,
        shares: shares(5_000_000),
        tradingDay: "2026-11-02",
        placedAt: new Date("2026-11-02T03:00:00Z"),
        tradesFrom: new Date("2026-11-02T02:00:00Z"),
        expiresAt: new Date("2026-11-02T09:26:00Z"),
        price: rupiah(4_980),
        quotedAt: new Date("2026-11-02T03:01:00Z"),
        value: rupiah(24_900_000_000),
        fee: rupiah(37_350_000),
        cost: rupiah(24_937_350_000),
        reason: portfolio.reason,
      })),
    });
  }
}

for (const locale of locales) {
  const text = texts[locale];
  for (const javaScriptEnabled of [true, false]) {
    test.describe(`${languageNames[locale]} with JavaScript ${String(javaScriptEnabled)}`, () => {
      test.use({ javaScriptEnabled });
      test("shows the demonstration summary and analysis inside its portfolio", async ({
        page,
        browser,
      }, testInfo) => {
        const { student, classId, classPath } = await studentOfNewClass(
          page,
          browser,
          { locale, ...widestClassNames },
        );
        const path = `${classPath}/demonstration`;
        await page.goto(path);
        const tabs = page.getByRole("navigation", {
          name: text.title,
          exact: true,
        });
        const check = async (): Promise<void> => {
          expect(await layoutProblems(page)).toEqual([]);
          await expectCompactChoice(tabs);
        };
        await expect(page).toHaveTitle(`${text.title} | Portolab`);
        await expect(page.getByText(text.body, { exact: true })).toBeVisible();
        const summary = page
          .getByRole("main")
          .locator("section")
          .filter({
            has: page.getByRole("heading", {
              name: text.valueTitle,
              exact: true,
            }),
          });
        await expect(
          summary.getByText(text.emptyValue, { exact: true }),
        ).toBeVisible();
        storeComparedPortfolios(classId);
        await page.reload();
        await expect(
          summary.getByText(text.value, { exact: true }),
        ).toBeVisible();
        for (const view of [
          { label: text.time, address: `${path}?view=time` },
          { label: text.map, address: path },
        ]) {
          await page
            .getByRole("link", { name: view.label, exact: true })
            .click();
          await expect(page).toHaveURL(view.address);
          await expectCompactChoice(tabs);
        }
        const lessonSource = page
          .getByRole("main")
          .getByRole("link", { name: text.learn, exact: true });
        await visitLessonAndReturn(lessonSource, {
          title: text.portfolioLesson,
          back: text.back,
          address: page.url(),
          javaScriptEnabled,
        });
        if (javaScriptEnabled) await expectAccessibleScreen(page);
        if (javaScriptEnabled)
          await captureScreens(page, testInfo, {
            name: `demonstration-${locale}`,
            fullPage: true,
            fromTop: true,
            check,
          });
        await tabs
          .getByRole("link", { name: text.analysis, exact: true })
          .click();
        await expect(page).toHaveURL(`${path}/analysis`);
        await visitLessonAndReturn(
          page
            .getByRole("main")
            .getByRole("link", { name: text.learn, exact: true }),
          {
            title: text.portfolioLesson,
            back: text.back,
            address: page.url(),
            javaScriptEnabled,
          },
        );
        if (javaScriptEnabled) await expectAccessibleScreen(page);
        if (javaScriptEnabled)
          await captureScreens(page, testInfo, {
            name: `demonstration-analysis-${locale}`,
            fullPage: true,
            fromTop: true,
            check,
          });
        await page
          .getByRole("link", { name: text.prices, exact: true })
          .click();
        await expect(page).toHaveURL(path);
        await tabs
          .getByRole("link", { name: text.analysis, exact: true })
          .click();
        const invalidAxis = await page.goto(`${path}/analysis?axis=wrong`);
        expect(invalidAxis?.status()).toBe(400);
        await page
          .getByRole("textbox", { name: text.axis, exact: true })
          .fill("beta");
        await page
          .getByRole("button", { name: text.apply, exact: true })
          .click();
        await expect(page).toHaveURL(`${path}/analysis?axis=beta`);
        await page
          .getByRole("region", { name: text.measures, exact: true })
          .getByRole("button", { name: text.calculate, exact: true })
          .first()
          .click();
        await expect(page.locator("#analysis-expectedReturn")).toBeVisible();
        await page
          .locator("#analysis-expectedReturn")
          .getByRole("button", { name: text.data, exact: true })
          .click();
        await page.locator("#stock-BBCA").click();
        const returnPath = `${path}/analysis?axis=beta&data=stocks#stock-BBCA`;
        await expect(page).toHaveURL(
          (url) => url.searchParams.get("returnTo") === returnPath,
        );
        await page
          .getByRole("link", { name: text.backToAnalysis, exact: true })
          .click();
        await expect(page).toHaveURL(returnPath);
        await expect(page.locator("#stock-BBCA")).toBeInViewport();
        await tabs
          .getByRole("link", { name: text.summary, exact: true })
          .click();
        await expect(page).toHaveURL(path);
        await student.context().close();
      });

      test("trades and cancels in the demonstration without sharing its work with students", async ({
        page,
        browser,
      }, testInfo) => {
        const { student, classId, classPath } = await studentOfNewClass(
          page,
          browser,
          { locale, ...widestClassNames },
        );
        const path = `${classPath}/demonstration`;
        const confirmation = {
          javaScriptEnabled,
          changed: text.changed,
          waiting: text.waiting,
          activity: { label: text.activityLink, path: `${path}/activity` },
        };
        storeComparedPortfolios(classId);
        const tabs = page.getByRole("navigation", {
          name: text.title,
          exact: true,
        });
        await page.goto(`${classPath}/stocks/BBCA/buy`);
        const ticket = page.locator("dialog[open]");
        // Python Decimal rounds the weight after one lot to 49.8% from the demonstration cash and BBCA holding in storeComparedPortfolios.
        await expect(impactAfterValue(ticket, 3)).toHaveText(text.impactWeight);
        await ticket
          .getByLabel(text.reason, { exact: true })
          .fill("Demonstration only.");
        const lots = ticket.getByRole("textbox", {
          name: text.lots,
          exact: true,
        });
        if (!javaScriptEnabled)
          await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
            "498747",
          );
        await lots.fill("7");
        await ticket
          .getByRole("button", { name: text.lotsHelp, exact: true })
          .click();
        await expect(page.locator("[popover]:popover-open")).toBeVisible();
        if (javaScriptEnabled) {
          const more = ticket.getByRole("link", {
            name: text.more,
            exact: true,
          });
          await visitLessonAndReturn(more, {
            title: text.tradingLesson,
            back: text.back,
            address: page.url(),
            javaScriptEnabled,
          });
        }
        await page.keyboard.press("Escape");
        await expect(lots).toHaveValue("7");
        await expect(
          ticket.getByLabel(text.reason, { exact: true }),
        ).toHaveValue("Demonstration only.");
        await lots.fill("2");
        if (javaScriptEnabled) await expectAccessibleScreen(page);
        if (javaScriptEnabled)
          await captureScreens(page, testInfo, {
            name: `demonstration-ticket-${locale}`,
            fullPage: true,
            fromTop: false,
          });
        await confirmOrderAndOpenActivity(ticket, {
          ...confirmation,
          total: "997494",
        });
        await expect(
          page.getByText("Demonstration only.", { exact: false }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: text.cancel, exact: true })
          .click();
        await page
          .getByRole("button", { name: text.confirm, exact: true })
          .click();
        await expect(page).toHaveURL(`${path}/activity`);
        if (javaScriptEnabled) await expectAccessibleScreen(page);
        if (javaScriptEnabled)
          await captureScreens(page, testInfo, {
            name: `demonstration-activity-${locale}`,
            fullPage: true,
            fromTop: true,
          });
        await tabs
          .getByRole("link", { name: text.activity, exact: true })
          .click();
        if (testInfo.project.name === "phone") {
          await page
            .getByRole("link", { name: text.journal, exact: true })
            .click();
          await expect(page).toHaveURL(
            `${path}/activity?view=journal&status=all`,
          );
        }
        await expect(
          page
            .getByText("Demonstration thesis.", { exact: false })
            .filter({ visible: true })
            .first(),
        ).toBeVisible();
        await tabs
          .getByRole("link", { name: text.summary, exact: true })
          .click();
        await expect(page).toHaveURL(path);
        await page.goto(`${classPath}/stocks/BBCA/sell`);
        await expect(ticket.locator('button[type="submit"]')).toContainText(
          text.sell,
        );
        await ticket
          .getByLabel(text.reason, { exact: true })
          .fill("Demonstration sale.");
        if (!javaScriptEnabled)
          await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
            "496755",
          );
        await ticket
          .getByRole("textbox", { name: text.lots, exact: true })
          .fill("2");
        // Python Decimal gives a purchase cost of 997,494 for two lots at 4,980. A sale deducts the fee of 1,494 and final tax of 996 from 996,000, so it receives 993,510.
        await confirmOrderAndOpenActivity(ticket, {
          ...confirmation,
          total: "993510",
        });
        await expect(
          page.getByText("Demonstration sale.", { exact: false }),
        ).toBeVisible();
        await student.goto(`${classPath}/activity`);
        await expect(
          student.getByText("Demonstration only.", { exact: false }),
        ).toHaveCount(0);
        await expect(
          student.getByText("Demonstration sale.", { exact: false }),
        ).toHaveCount(0);
        await student.context().close();
      });
    });
  }

  test(`hides the demonstration from students and other lecturers in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFound,
      addresses: ({ classPath, otherClassPath }) => [
        ...["", "/activity", "/analysis"].flatMap((suffix) => [
          {
            reader: "student" as const,
            path: `${classPath}/demonstration${suffix}`,
          },
          {
            reader: "otherLecturer" as const,
            path: `${classPath}/demonstration${suffix}`,
          },
        ]),
        { reader: "lecturer", path: `${otherClassPath}/stocks/BBCA/buy` },
        { reader: "lecturer", path: `${otherClassPath}/stocks/BBCA/sell` },
      ],
    });
  });
}
