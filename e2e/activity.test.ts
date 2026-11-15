import { holdClientScripts } from "./hold-client-scripts.ts";
import { captureScreens } from "./capture-screens.ts";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { reasonMaximumLength } from "../app/features/trading/reason-maximum-length.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { layoutProblems } from "./expect-layout.ts";
import { isPhone } from "./frame.ts";
import { newDevice } from "./new-device.ts";
import {
  storeActivityOrders,
  widenActivityReasons,
} from "./store-activity-orders.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { wideWord } from "./wide-word.ts";

const texts: Record<
  Locale,
  {
    title: string;
    view: string;
    journal: string;
    orders: string;
    filter: string;
    all: string;
    rejected: string;
    filled: string;
    waiting: string;
    expired: string;
    cancelled: string;
    cancel: string;
    confirm: string;
    keep: string;
    cancelQuestion: string;
    noOrders: string;
    noTrades: string;
    open: string;
    ticketWaiting: string;
    activityLink: string;
    twoTrades: string;
    notFoundTitle: string;
    chooseStatus: string;
    chooseView: string;
    apply: string;
    badStatus: string;
    badView: string;
    tooLong: string;
    buyChange: string;
    saleChange: string;
  }
> = {
  id: {
    buyChange: "▲ +0,81%",
    saleChange: "▼ -2,35%",
    chooseStatus: "Pilih status",
    chooseView: "Pilih tampilan",
    apply: "Tampilkan aktivitas",
    badStatus:
      'Kolom "Saring menurut status" berisi "wrong", tetapi kolom itu hanya menerima "Semua", "Menunggu", "Terisi", "Ditolak", "Kedaluwarsa", atau "Dibatalkan". Pilih salah satunya.',
    badView:
      'Kolom "Tampilan aktivitas" berisi "wrong", tetapi kolom itu hanya menerima "Order" atau "Jurnal". Pilih salah satunya.',
    tooLong:
      'Kolom "Saring menurut status" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    twoTrades: "Jurnal transaksi 2 transaksi",
    title: "Aktivitas",
    view: "Tampilan aktivitas",
    journal: "Jurnal",
    orders: "Order",
    notFoundTitle: "Halaman tidak ditemukan",
    filter: "Saring menurut status",
    all: "Semua",
    rejected: "Ditolak",
    filled: "Terisi",
    waiting: "Menunggu",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
    cancel: "Batalkan order",
    confirm: "Ya, batalkan",
    keep: "Tidak",
    cancelQuestion: 'Batalkan order "Beli" atas 5 lot BBCA?',
    noOrders:
      "Belum ada order. Order pertama muncul di sini setelah Anda memasang order saham.",
    noTrades: "Transaksi yang terisi muncul di sini bersama alasannya.",
    open: "Buka tiket BBCA",
    ticketWaiting: "Order menunggu",
    activityLink: "Lihat di Aktivitas",
  },
  en: {
    buyChange: "▲ +0.81%",
    saleChange: "▼ -2.35%",
    chooseStatus: "Choose a status",
    chooseView: "Choose a view",
    apply: "Show activity",
    badStatus:
      'The field "Filter by status" holds "wrong", but the field takes only "All", "Waiting", "Filled", "Rejected", "Expired", or "Cancelled". Choose one of them.',
    badView:
      'The field "Activity view" holds "wrong", but the field takes only "Orders" or "Journal". Choose one of them.',
    tooLong:
      'The field "Filter by status" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
    twoTrades: "Trade journal 2 trades",
    title: "Activity",
    view: "Activity view",
    journal: "Journal",
    orders: "Orders",
    notFoundTitle: "Page not found",
    filter: "Filter by status",
    all: "All",
    rejected: "Rejected",
    filled: "Filled",
    waiting: "Waiting",
    expired: "Expired",
    cancelled: "Cancelled",
    cancel: "Cancel order",
    confirm: "Yes, cancel",
    keep: "No",
    cancelQuestion: 'Cancel the "Buy" order for 5 lots of BBCA?',
    noOrders:
      "No orders yet. Your first stock order appears here once you place it.",
    noTrades: "Filled trades appear here with their reasons.",
    open: "Open ticket for BBCA",
    ticketWaiting: "Order waiting",
    activityLink: "View in Activity",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`hides the activity of another class and the student's activity from lecturers in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFoundTitle,
      addresses: ({ classPath, otherClassPath }) => [
        { reader: "lecturer", path: `${classPath}/activity` },
        { reader: "student", path: `${otherClassPath}/activity` },
        { reader: "student", path: "/classes/999999999/activity" },
      ],
    });
  });

  test(`keeps the native filter when JavaScript loads and then navigates with the client in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await placeWaitingOrder(student, classPath, locale);
    await holdClientScripts(
      student,
      {
        otherDevice: student.context(),
        address: `${classPath}/activity`,
      },
      async (loadClient) => {
        const filters = student.getByRole("navigation", { name: text.filter });
        await filters
          .getByRole("link", { name: `${text.waiting} · 1`, exact: true })
          .click({ noWaitAfter: true });
        await expect(student).toHaveURL(/status=waiting$/);
        await student
          .getByRole("button", { name: text.cancel, exact: true })
          .click();
        const confirmation = student.getByRole("dialog", {
          name: text.cancel,
          exact: true,
        });
        await expect(confirmation).toBeVisible();
        await loadClient();
        await student.waitForFunction(
          () => "__reactRouterDataRouter" in window,
        );
        await expect(
          filters.getByRole("link", {
            name: `${text.waiting} · 1`,
            exact: true,
          }),
        ).toHaveAttribute("aria-current", "page");
        await expect(confirmation).toBeVisible();
        await confirmation
          .getByRole("button", { name: text.keep, exact: true })
          .click();
        await expect(confirmation).toBeHidden();
        const clientNavigation = student.waitForRequest((request) =>
          new URL(request.url()).pathname.endsWith(".data"),
        );
        await filters
          .getByRole("link", { name: `${text.all} · 1`, exact: true })
          .click();
        await clientNavigation;
        await expect(student).toHaveURL(/status=all$/);
      },
    );
  });

  test(`filters orders, cancels a waiting order, and switches the journal before JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    await correctActivityQuery(student, classPath, locale);
    await student.goto(`${classPath}/activity`);
    await expect(
      student.getByRole("heading", { name: text.title, exact: true }),
    ).toBeVisible();
    await expect(
      student.getByText(text.noOrders, { exact: true }),
    ).toBeVisible();
    if (isPhone()) {
      await student
        .getByRole("navigation", { name: text.view })
        .getByRole("link", { name: text.journal, exact: true })
        .click();
    }
    await expect(
      student.getByText(text.noTrades, { exact: true }),
    ).toBeVisible();
    await expectAccessibleScreen(student);
    await placeWaitingOrder(student, classPath, locale);
    storeActivityOrders(classId);
    const native = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      storageState: await student.context().storageState(),
    });
    await correctActivityQuery(native, classPath, locale);
    await native.goto(`${classPath}/activity`);
    const filters = native.getByRole("navigation", { name: text.filter });
    await filters
      .getByRole("link", { name: `${text.waiting} · 1`, exact: true })
      .click();
    await expect(native).toHaveURL(/status=waiting$/);
    await expect(
      native.getByRole("button", { name: text.cancel, exact: true }),
    ).toHaveCount(1);
    const stale = await native.context().newPage();
    await stale.setViewportSize({ width: 1440, height: 900 });
    const staleAddress = new URL(native.url());
    staleAddress.searchParams.set("view", "journal");
    await stale.goto(staleAddress.href);
    await native
      .getByRole("button", { name: text.cancel, exact: true })
      .click();
    await expect(
      native.getByText(text.cancelQuestion, { exact: true }),
    ).toBeVisible();
    await native.getByRole("button", { name: text.keep, exact: true }).click();
    await native
      .getByRole("button", { name: text.cancel, exact: true })
      .click();
    await native
      .getByRole("button", { name: text.confirm, exact: true })
      .click();
    await expect(native).toHaveURL(/status=waiting$/);
    await expect(
      native.getByRole("button", { name: text.cancel, exact: true }),
    ).toHaveCount(0);
    await stale.getByRole("button", { name: text.cancel, exact: true }).click();
    await stale
      .getByRole("button", { name: text.confirm, exact: true })
      .click();
    await expect(stale.getByRole("alert")).toBeVisible();
    await stale.setViewportSize({ width: 360, height: 900 });
    const staleOrders = stale.getByRole("region", {
      name: text.orders,
      exact: true,
    });
    await expect(staleOrders).toBeVisible();
    await expect(
      staleOrders.locator('ul[data-layout="rows"] > li'),
    ).toHaveCount(6);
    await expect(
      stale
        .getByRole("navigation", { name: text.view })
        .getByRole("link", { name: text.orders, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(await layoutProblems(stale)).toEqual([]);
    for (const [status, count] of [
      [text.filled, 2],
      [text.expired, 1],
      [text.cancelled, 2],
    ] as const) {
      await filters
        .getByRole("link", {
          name: `${status} · ${String(count)}`,
          exact: true,
        })
        .click();
      await expect(
        native
          .getByRole("region", { name: text.orders, exact: true })
          .locator('ul[data-layout="rows"] > li'),
      ).toHaveCount(count);
    }
    await filters
      .getByRole("link", { name: `${text.rejected} · 1`, exact: true })
      .click();
    await expect(
      native.getByRole("link", { name: text.open, exact: true }),
    ).toHaveAttribute("href", `${classPath}/stocks/BBCA`);
    await filters
      .getByRole("link", { name: `${text.all} · 6`, exact: true })
      .click();
    if (isPhone()) {
      await native
        .getByRole("navigation", { name: text.view })
        .getByRole("link", { name: text.journal, exact: true })
        .click();
      await expect(native).toHaveURL(/view=journal/);
    }
    await expect(
      native.getByRole("heading", {
        name: text.twoTrades,
      }),
    ).toBeVisible();
    await expect(
      native.getByText(text.buyChange, { exact: true }),
    ).toBeVisible();
    await expect(
      native.getByText(text.saleChange, { exact: true }),
    ).toBeVisible();
    await native.context().close();
    await placeWaitingOrder(student, classPath, locale);
    await student.goto(`${classPath}/activity`);
    await captureActivity(student, classPath, locale);
    for (const [kind, reason] of [
      ["wide", wideWord("Alasan", reasonMaximumLength)],
      ["digits", "9".repeat(reasonMaximumLength)],
    ] as const) {
      widenActivityReasons(classId, reason);
      for (const view of ["orders", "journal"]) {
        await student.goto(`${classPath}/activity?view=${view}`);
        expect(await layoutProblems(student)).toEqual([]);
        await expectAccessibleScreen(student);
        if (isPhone())
          await captureScreens(student, test.info(), {
            name: `activity-${locale}-${kind}-${view}`,
            fullPage: true,
            fromTop: true,
          });
      }
    }
    await student.context().close();
  });
}

async function correctActivityQuery(
  page: Page,
  classPath: string,
  locale: Locale,
): Promise<void> {
  const text = texts[locale];
  const response = await page.goto(
    `${classPath}/activity?status=wrong&view=wrong`,
  );
  expect(response?.status()).toBe(400);
  await expect(page.getByText(text.badStatus, { exact: true })).toBeVisible();
  await expect(page.getByText(text.badView, { exact: true })).toBeVisible();
  const status = page.getByRole("combobox", { name: text.filter, exact: true });
  const view = page.getByRole("combobox", { name: text.view, exact: true });
  await expect(status).toHaveValue("wrong");
  await expect(view).toHaveValue("wrong");
  await expect(
    status.getByRole("option", { name: text.chooseStatus, exact: true }),
  ).toHaveCount(1);
  await expect(
    view.getByRole("option", { name: text.chooseView, exact: true }),
  ).toHaveCount(1);
  await status.selectOption("all");
  await view.selectOption("orders");
  await page.getByRole("button", { name: text.apply, exact: true }).click();
  await expect(page).toHaveURL(/status=all&view=orders$/);
  const oversized = await page.goto(
    `${classPath}/activity?status=${"x".repeat(fieldMaximumLength + 1)}`,
  );
  expect(oversized?.status()).toBe(400);
  await expect(page.getByText(text.tooLong, { exact: true })).toBeVisible();
  await status.selectOption("all");
  await page.getByRole("button", { name: text.apply, exact: true }).click();
}

async function placeWaitingOrder(
  student: Page,
  classPath: string,
  locale: Locale,
): Promise<void> {
  const text = texts[locale];
  await student.goto(`${classPath}/stocks/BBCA/buy?lots=5`);
  await student.locator('dialog button[type="submit"]').click();
  await expect(student).toHaveURL(/\/stocks\/BBCA\/buy\?placed=\d+$/);
  await expect(
    student.getByRole("heading", { name: text.ticketWaiting, exact: true }),
  ).toBeVisible();
  await student
    .getByRole("link", { name: text.activityLink, exact: true })
    .click();
  await expect(student).toHaveURL(`${classPath}/activity`);
}

async function captureActivity(
  student: Page,
  classPath: string,
  locale: Locale,
): Promise<void> {
  const views = isPhone() ? ["orders", "journal"] : ["orders"];
  for (const view of views) {
    await student.goto(`${classPath}/activity?view=${view}`);
    await captureScreens(student, test.info(), {
      name: `activity-${locale}-${view}`,
      fullPage: true,
      fromTop: true,
      check: async () => {
        expect(await layoutProblems(student)).toEqual([]);
        const clockLines = await student
          .locator("time > [data-number]:visible")
          .evaluateAll((clocks) =>
            clocks.map((clock) => clock.getClientRects().length),
          );
        expect(clockLines.length).toBeGreaterThan(0);
        expect(clockLines.every((lines) => lines === 1)).toBe(true);
      },
    });
  }
}
