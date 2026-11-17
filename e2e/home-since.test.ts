import type { Browser, Page } from "@playwright/test";
import {
  homeSummaryTimeField,
  homeSummaryTimeMaximumLength,
} from "../app/features/trading/home-summary-time.ts";
import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { captureScreens } from "./capture-screens.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { newDevice } from "./new-device.ts";
import { storeActivityOrders } from "./store-activity-orders.ts";
import {
  storeHomeDesignPortfolio,
  homeDesignStartingCash,
} from "./store-home-design-portfolio.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import { storeWideHomeOrder } from "./store-wide-home-order.ts";

const texts: Record<
  Locale,
  {
    title: string;
    close: string;
    filled: string;
    rejected: string;
    expired: string;
    cancelled: string;
    retry: string;
    reload: string;
  }
> = {
  id: {
    title: "Sejak kunjungan terakhir",
    close: "Tutup",
    filled: "Terisi",
    rejected: "Ditolak",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
    retry: "Buka tiket BBCA",
    reload: "Muat ulang Beranda",
  },
  en: {
    title: "Since your last visit",
    close: "Close",
    filled: "Filled",
    rejected: "Rejected",
    expired: "Expired",
    cancelled: "Cancelled",
    retry: "Open ticket for BBCA",
    reload: "Reload Home",
  },
};

for (const locale of locales) {
  test(`honors an older summary cutoff and recovers from malformed metadata before JavaScript in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    const { student, classPath } = await studentWithSummaryForTest(
      page,
      browser,
      locale,
    );
    const native = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      storageState: await student.context().storageState(),
    });
    await native.goto(`${classPath}?view=time`);
    const card = native.getByRole("region", { name: text.title, exact: true });
    const moment = native.locator(`input[name="${homeSummaryTimeField}"]`);
    // An archived form can arrive after later outcomes or after another device closed a newer summary.
    for (const [shownAt, rows] of [
      ["2026-10-29T03:00:00.000Z", 3],
      ["2026-10-29T04:00:00.000Z", 1],
      ["2026-10-29T03:00:00.000Z", 1],
    ] as const) {
      await moment.evaluate((input: HTMLInputElement, value) => {
        input.value = value;
      }, shownAt);
      await card.getByRole("button", { name: text.close, exact: true }).click();
      await expect(card.getByRole("listitem")).toHaveCount(rows);
    }
    await moment.evaluate((input: HTMLInputElement) => {
      input.value = "bad";
    });
    const answer = native.waitForResponse(
      (response) =>
        response.url().includes(classPath) &&
        response.request().method() === "POST",
    );
    await card.getByRole("button", { name: text.close, exact: true }).click();
    expect((await answer).status()).toBe(400);
    const alert = card.getByRole("alert");
    await expect(alert).toContainText('"bad"');
    await expect(alert).toContainText(text.title);
    await expect(card.getByRole("listitem")).toHaveCount(1);
    await alert.getByRole("link", { name: text.reload, exact: true }).click();
    await expect(native).toHaveURL(`${classPath}?view=time`);
    await expect(alert).toHaveCount(0);
    await card.getByRole("button", { name: text.close, exact: true }).click();
    await expect(card).toHaveCount(0);
    await native.context().close();
    await student.context().close();
  });
  test(`keeps the largest order and starting cash inside home in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId } = await studentOfNewClass(page, browser, {
      locale,
      className: "Manajemen Portofolio A",
      lecturerName: "Dosen",
      studentName: "Mahasiswa",
      startingCash: startingCashLimits.maximum,
    });
    storeWideHomeOrder(classId);
    await student.reload();
    const card = student.getByRole("region", {
      name: texts[locale].title,
      exact: true,
    });
    await expect(card.getByRole("listitem")).toHaveCount(1);
    await expectAccessibleScreen(student);
    expect(await layoutProblems(student)).toEqual([]);
    const numberLines = await card
      .locator("[data-number]")
      .evaluateAll((numbers) =>
        numbers.map((number) => number.getClientRects().length),
      );
    expect(numberLines.length).toBeGreaterThan(0);
    expect(numberLines.every((count) => count === 1)).toBe(true);
    await student.context().close();
  });
  test(`keeps the closed home summary across devices before and after JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const text = texts[locale];
    const { student, classPath } = await studentWithSummaryForTest(
      page,
      browser,
      locale,
    );
    const card = student.getByRole("region", { name: text.title, exact: true });
    await expect(card.getByRole("listitem")).toHaveCount(4);
    await expect(card.getByText(text.filled, { exact: true })).toHaveCount(2);
    await expect(card.getByText(text.rejected, { exact: true })).toBeVisible();
    await expect(card.getByText(text.expired, { exact: true })).toBeVisible();
    await expect(card.getByText(text.cancelled, { exact: true })).toHaveCount(
      0,
    );
    await expect(card.getByRole("link", { name: text.retry })).toHaveAttribute(
      "href",
      `${classPath}/stocks/BBCA/buy`,
    );
    await expectAccessibleScreen(student);
    await captureScreens(student, test.info(), {
      name: `home-since-${locale}`,
      fullPage: true,
      fromTop: true,
      check: async () => {
        expect(await layoutProblems(student)).toEqual([]);
      },
    });
    for (const [kind, value] of [
      ["letters", "W".repeat(homeSummaryTimeMaximumLength)],
      ["digits", "9".repeat(homeSummaryTimeMaximumLength)],
    ] as const) {
      await student
        .locator(`input[name="${homeSummaryTimeField}"]`)
        .evaluate((input: HTMLInputElement, malformed) => {
          input.value = malformed;
        }, value);
      await card.getByRole("button", { name: text.close, exact: true }).click();
      const alert = card.getByRole("alert");
      await expect(alert).toContainText(JSON.stringify(value));
      await expect(alert).toContainText(text.title);
      await expectAccessibleScreen(student);
      expect(await layoutProblems(student)).toEqual([]);
      if (kind === "letters")
        await captureScreens(student, test.info(), {
          name: `home-since-error-${locale}`,
          fullPage: true,
          fromTop: true,
        });
    }
    await card
      .getByRole("alert")
      .getByRole("link", { name: text.reload, exact: true })
      .click();
    await expect(card.getByRole("alert")).toHaveCount(0);
    const storageState = await student.context().storageState();
    await holdClientScripts(
      student,
      { address: `${classPath}?view=time` },
      async (loadClient) => {
        await card
          .getByRole("button", { name: text.close, exact: true })
          .click({ noWaitAfter: true });
        await expect(card).toHaveCount(0);
        await expect(student).toHaveURL(`${classPath}?view=time`);
        await loadClient();
        await expect(card).toHaveCount(0);
      },
    );
    const other = await newDevice(browser, locale, {
      storageState,
      javaScriptEnabled: false,
    });
    await other.goto(classPath);
    await expect(
      other.getByRole("region", { name: text.title, exact: true }),
    ).toHaveCount(0);
    await other.context().close();
    await student.reload();
    await expect(card).toHaveCount(0);
    await student.context().close();
  });
}

async function studentWithSummaryForTest(
  page: Page,
  browser: Browser,
  locale: Locale,
) {
  const prepared = await studentOfNewClass(page, browser, {
    locale,
    className: "Manajemen Portofolio A",
    lecturerName: "Dosen",
    studentName: "Mahasiswa",
    startingCash: homeDesignStartingCash,
  });
  await expect(
    prepared.student.getByRole("region", {
      name: texts[locale].title,
      exact: true,
    }),
  ).toHaveCount(0);
  storeHomeDesignPortfolio(prepared.classId);
  storeActivityOrders(prepared.classId);
  await prepared.student.reload();
  return prepared;
}
