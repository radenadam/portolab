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
  },
  en: {
    title: "Since your last visit",
    close: "Close",
    filled: "Filled",
    rejected: "Rejected",
    expired: "Expired",
    cancelled: "Cancelled",
    retry: "Open ticket for BBCA",
  },
};

for (const locale of locales) {
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
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      {
        locale,
        className: "Manajemen Portofolio A",
        lecturerName: "Dosen",
        studentName: "Mahasiswa",
        startingCash: homeDesignStartingCash,
      },
    );
    const card = student.getByRole("region", { name: text.title, exact: true });
    await expect(card).toHaveCount(0);
    storeHomeDesignPortfolio(classId);
    storeActivityOrders(classId);
    await student.reload();
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
