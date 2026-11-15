import { languageNames } from "../app/language-names.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { screenshotFullHeight } from "./screenshot-full-height.ts";

const texts: Record<
  Locale,
  {
    title: string;
    activityTitle: string;
    lots: string;
    reason: string;
    max: string;
    maxLotsValue: string;
    down: string;
    up: string;
    limit: string;
    market: string;
    price: string;
    buy: string;
    sell: string;
    done: string;
    waiting: string;
    activity: string;
    changed: string;
    paid: string;
    received: string;
    value: string;
    fee: string;
    tax: string;
    after: string;
    quote: string;
    hint: string;
    help: string;
    noPrice: string;
    lotsFix: string;
    badKind: string;
    kind: string;
    priceUp: string;
    priceDown: string;
    nextPrice: string;
    previousPrice: string;
  }
> = {
  id: {
    maxLotsValue: "50.000",
    activityTitle: "Aktivitas",
    title: "Tiket order BBCA",
    lots: "Jumlah lot",
    reason: "Alasan (opsional)",
    max: "Maks",
    down: "Kurangi lot",
    up: "Tambah lot",
    limit: "Limit",
    market: "Pasar",
    price: "Harga limit",
    buy: "Beli",
    sell: "Jual",
    done: "Selesai",
    waiting: "Order menunggu",
    activity: "Lihat di Aktivitas",
    changed:
      "Total order berubah dari pratinjau yang Anda lihat. Periksa rincian biaya, lalu konfirmasi lagi.",
    paid: "Total dibayar",
    received: "Total diterima",
    value: "Nilai 1 lot × Rp 4.980",
    fee: "Biaya broker 0,15%",
    tax: "PPh final 0,1%",
    after: "Kas tersedia setelahnya",
    quote: "30 Okt 2026, 16.14 WIB",
    hint: "Tersimpan bersama order ini, dan dosen kelas ini dapat membacanya.",
    help: "Apa itu Jumlah lot?",
    noPrice:
      "Anda dapat memasang order WIFI setelah pembaruan harga berikutnya membawa harga tertunda WIFI.",
    lotsFix: "Ubah ke 5 lot",
    badKind:
      'Kolom "Jenis order" berisi "wrong", tetapi kolom itu hanya menerima "Pasar" atau "Limit". Pilih salah satunya.',
    kind: "Jenis order",
    priceUp: "Naikkan harga satu fraksi",
    priceDown: "Turunkan harga satu fraksi",
    nextPrice: "4.990",
    previousPrice: "4.980",
  },
  en: {
    maxLotsValue: "50,000",
    activityTitle: "Activity",
    title: "Order ticket BBCA",
    lots: "Lots",
    reason: "Reason (optional)",
    max: "Max",
    down: "Decrease the lots",
    up: "Increase the lots",
    limit: "Limit",
    market: "Market",
    price: "Limit price",
    buy: "Buy",
    sell: "Sell",
    done: "Done",
    waiting: "Order waiting",
    activity: "View in Activity",
    changed:
      "The order total changed from the preview you saw. Check the cost breakdown, then confirm again.",
    paid: "Total paid",
    received: "Total received",
    value: "Value of 1 lot × IDR 4,980",
    fee: "Broker fee 0.15%",
    tax: "Final tax 0.1%",
    after: "Available cash after",
    quote: "Oct 30, 2026, 4:14 PM WIB",
    hint: "Saved with this order, and the lecturer of this class can read it.",
    help: "What is Lots?",
    noPrice:
      "You can place an order of WIFI once the next update of prices brings a delayed price of WIFI.",
    lotsFix: "Change to 5 lots",
    badKind:
      'The field "Kind of order" holds "wrong", but the field takes only "Market" or "Limit". Choose one of them.',
    kind: "Kind of order",
    priceUp: "Increase the price by one tick",
    priceDown: "Decrease the price by one tick",
    nextPrice: "4,990",
    previousPrice: "4,980",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`previews a purchase and sale, preserves the draft through help and steppers, and confirms with Enter in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (id) => {
        storeTestHolding(id, bbcaHolding);
      },
    });
    await student.goto(`${classPath}/stocks/BBCA?range=1y`);
    await student.locator('[data-stock-trade="buy"]').click();
    await expect(student).toHaveURL(`${classPath}/stocks/BBCA/buy?range=1y`);
    const ticket = student.locator("dialog[open]");
    await expect(ticket).toBeVisible();
    expect(await student.title()).toContain(text.title);
    for (const value of [text.value, text.paid, text.after])
      await expect(ticket.getByText(value, { exact: true })).toBeVisible();
    await expect(
      ticket.getByText(text.quote, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(ticket.getByText(text.hint, { exact: true })).toBeVisible();
    // Python Decimal with ROUND_HALF_UP gives 498000 + 747 = 498747 for one lot at the fixture quote.
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
      "498747",
    );
    await expect(ticket.getByText(text.fee, { exact: true })).toBeVisible();
    await ticket
      .getByRole("textbox", { name: text.lots, exact: true })
      .fill("2");
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
      "997494",
    );
    await ticket
      .getByLabel(text.reason, { exact: true })
      .fill("Kredit tumbuh.\n\nBeta di bawah 1.");
    await ticket.getByRole("button", { name: text.help, exact: true }).click();
    await student.keyboard.press("Escape");
    await expect(
      ticket.getByRole("textbox", { name: text.lots, exact: true }),
    ).toHaveValue("2");
    await ticket.getByRole("link", { name: text.up, exact: true }).click();
    await expect(
      ticket.getByRole("textbox", { name: text.lots, exact: true }),
    ).toHaveValue("3");
    await ticket.getByRole("link", { name: text.down, exact: true }).click();
    await expect(ticket.getByLabel(text.reason, { exact: true })).toHaveValue(
      "Kredit tumbuh.\n\nBeta di bawah 1.",
    );
    if (testInfo.project.name === "desktop") {
      await student.locator('a[href*="range=1m"]').first().click();
      await expect(student).toHaveURL(`${classPath}/stocks/BBCA/buy?range=1m`);
      await expect(
        student.locator('a[href*="range=1m"]').first(),
      ).toHaveAttribute("aria-current", "true");
      await expect(
        ticket.getByRole("textbox", { name: text.lots, exact: true }),
      ).toHaveValue("2");
      await expect(ticket.getByLabel(text.reason, { exact: true })).toHaveValue(
        "Kredit tumbuh.\n\nBeta di bawah 1.",
      );
      await student.locator('a[href*="range=1y"]').first().click();
      await expect(
        student.locator('a[href*="range=1y"]').first(),
      ).toHaveAttribute("aria-current", "true");
    }
    await ticket.getByRole("link", { name: text.sell, exact: true }).click();
    await expect(ticket).toHaveAttribute("data-side", "sell");
    await expect(ticket.getByText(text.tax, { exact: true })).toBeVisible();
    await expect(
      ticket.getByText(text.received, { exact: true }),
    ).toBeVisible();
    // Two lots sell for 996000 less 1494 fee and 996 tax, independently calculated with Decimal.
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
      "993510",
    );
    await ticket.getByRole("link", { name: text.buy, exact: true }).click();
    await expect(ticket).toHaveAttribute("data-side", "buy");
    await ticket.getByRole("link", { name: text.max, exact: true }).click();
    await expect(
      ticket.getByRole("textbox", { name: text.lots, exact: true }),
    ).toHaveValue(text.maxLotsValue);
    for (const width of testInfo.project.name === "phone"
      ? [360]
      : [1440, 1920]) {
      await student.setViewportSize({ width, height: 740 });
      for (const colorScheme of ["light", "dark"] as const) {
        await student.emulateMedia({ colorScheme });
        expect(await layoutProblems(student)).toEqual([]);
        if (width === 360)
          await student.screenshot({
            path: testInfo.outputPath(
              `ticket-${locale}-${String(width)}-${colorScheme}.png`,
            ),
          });
        else
          await screenshotFullHeight(student, {
            path: testInfo.outputPath(
              `ticket-${locale}-${String(width)}-${colorScheme}.png`,
            ),
          });
      }
    }
    await expectAccessibleScreen(student);
    if (testInfo.project.name === "phone") {
      await student.keyboard.press("Escape");
      await expect(student).toHaveURL(`${classPath}/stocks/BBCA?range=1y`);
      await expect(student.locator('[data-stock-trade="buy"]')).toBeFocused();
      await student.locator('[data-stock-trade="buy"]').click();
      await expect(
        ticket.getByRole("textbox", { name: text.lots, exact: true }),
      ).toHaveValue(text.maxLotsValue);
      await expect(ticket.getByLabel(text.reason, { exact: true })).toHaveValue(
        "Kredit tumbuh.\n\nBeta di bawah 1.",
      );
    }
    await ticket
      .getByRole("textbox", { name: text.lots, exact: true })
      .fill("1");
    await ticket
      .getByRole("textbox", { name: text.lots, exact: true })
      .press("Enter");
    await expect(student).toHaveURL(
      /\/stocks\/BBCA\/buy\?range=1y&placed=\d+$/,
    );
    await expect(
      student.getByRole("heading", { name: text.waiting, exact: true }),
    ).toBeVisible();
    await expect(
      student.getByRole("link", { name: text.activity, exact: true }),
    ).toHaveAttribute("href", `${classPath}/activity`);
    await student
      .getByRole("link", { name: text.activity, exact: true })
      .click();
    await expect(student).toHaveURL(`${classPath}/activity`);
    await expect(
      student.getByRole("heading", { name: text.activityTitle, exact: true }),
    ).toBeVisible();
    await student.goBack();
    await expectAccessibleScreen(student);
    await student
      .locator('[role="status"]')
      .getByRole("link", { name: text.done, exact: true })
      .click();
    await expect(student).toHaveURL(`${classPath}/stocks/BBCA?range=1y`);
    await student.context().close();
  });

  test(`keeps missing prices and access failures on a localized page in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    await student.goto(`${classPath}/stocks/WIFI/buy`);
    await expect(
      student.getByText(text.noPrice, { exact: true }),
    ).toBeVisible();
    await expect(student.locator("dialog form")).toHaveCount(0);
    const invalidKind = await student.goto(
      `${classPath}/stocks/BBCA/buy?priceKind=wrong`,
    );
    expect(invalidKind?.status()).toBe(400);
    await expect(
      student.getByText(text.badKind, { exact: true }),
    ).toBeVisible();
    await expect(
      student.getByRole("combobox", { name: text.kind, exact: true }),
    ).toHaveValue("wrong");
    await student
      .locator("dialog")
      .getByRole("link", { name: text.market, exact: true })
      .click();
    await expect(student.getByText(text.badKind, { exact: true })).toHaveCount(
      0,
    );
    for (const [device, path] of [
      [page, `${classPath}/stocks/BBCA/buy`],
      [student, "/classes/999999999/stocks/BBCA/buy"],
      [student, `${classPath}/stocks/BBCA/hold`],
      [student, `${classPath}/orders`],
    ] as const) {
      const response = await device.goto(path);
      expect(response?.status()).toBe(404);
    }
    await student.context().close();
  });

  test(`corrects the lots inline and keeps the reason through an unavailable limit preview in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (id) => {
        storeTestHolding(id, {
          cash: rupiah(2_500_000),
          code: "BBCA",
          shares: shares(500),
          cost: rupiah(2_473_705),
        });
      },
    });
    await student.goto(`${classPath}/stocks/BBCA/buy`);
    const ticket = student.locator("dialog[open]");
    const lots = ticket.getByRole("textbox", { name: text.lots, exact: true });
    const reason = ticket.getByLabel(text.reason, { exact: true });
    await reason.fill("Tesis tetap tersimpan.");
    async function useCorrection() {
      await lots.fill("6");
      await expect(ticket.locator('button[type="submit"]')).toBeEnabled();
      await lots.press("Enter");
      await ticket
        .getByRole("link", { name: text.lotsFix, exact: true })
        .click();
      await expect(lots).toHaveValue("5");
      await expect(ticket.getByRole("alert")).toHaveCount(0);
      await expect(reason).toHaveValue("Tesis tetap tersimpan.");
    }
    await useCorrection();
    // Decimal gives 2493735 for five bought lots at 4980, and 2483775 for five sold lots.
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
      "2493735",
    );
    await ticket.getByRole("link", { name: text.sell, exact: true }).click();
    await expect(ticket).toHaveAttribute("data-side", "sell");
    await useCorrection();
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
      "2483775",
    );
    await ticket.getByRole("link", { name: text.limit, exact: true }).click();
    const price = ticket.getByRole("textbox", {
      name: text.price,
      exact: true,
    });
    await price.fill("90000000000000");
    await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue("");
    await ticket.getByRole("link", { name: text.market, exact: true }).click();
    await expect(reason).toHaveValue("Tesis tetap tersimpan.");
    await expectAccessibleScreen(student);
    expect(await layoutProblems(student)).toEqual([]);
    await expect(ticket.locator('button[type="submit"]')).toBeEnabled();
    await lots.press("Enter");
    await expect(
      student.getByRole("heading", { name: text.waiting, exact: true }),
    ).toBeVisible();
    await student.context().close();
  });

  test(`keeps native input while hydration enables the ticket controls in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/stocks/BBCA/buy",
    });
    await holdClientScripts(
      page,
      { otherDevice: lecturer.context() },
      async (loadClient) => {
        await page
          .getByRole("link", { name: text.up, exact: true })
          .click({ noWaitAfter: true });
        await expect(page).toHaveURL(/lots=2/);
        await expect(page.locator('dialog input[name="lots"]')).toHaveValue(
          "2",
        );
        await page
          .locator("dialog")
          .getByRole("link", { name: text.limit, exact: true })
          .click({ noWaitAfter: true });
        await expect(
          page.getByRole("textbox", { name: text.price, exact: true }),
        ).toHaveValue(text.previousPrice);
        await page
          .getByRole("link", { name: text.priceUp, exact: true })
          .click({ noWaitAfter: true });
        await expect
          .poll(() => new URL(page.url()).searchParams.get("price"))
          .toBe(text.nextPrice);
        await expect(
          page.getByRole("textbox", { name: text.price, exact: true }),
        ).toHaveValue(text.nextPrice);
        await page.locator('dialog input[name="lots"]').fill("7");
        await page.locator('dialog textarea[name="reason"]').fill("Tesis");
        await loadClient();
        await expect(page.locator("dialog form")).toHaveAttribute(
          "data-ticket-ready",
          "true",
        );
        await page
          .getByRole("link", { name: text.priceDown, exact: true })
          .click();
        await expect(
          page.getByRole("textbox", { name: text.price, exact: true }),
        ).toHaveValue(text.previousPrice);
        expect(new URL(page.url()).searchParams.get("price")).toBe(
          text.nextPrice,
        );
        await page
          .locator("dialog")
          .getByRole("link", { name: text.market, exact: true })
          .click();
        await expect(
          page.getByRole("textbox", { name: text.price, exact: true }),
        ).toHaveCount(0);
        await page.locator("dialog a").filter({ hasText: "50%" }).click();
        await expect(page.locator('dialog input[name="lots"]')).toHaveValue(
          text.maxLotsValue,
        );
        await expect(
          page.locator('dialog textarea[name="reason"]'),
        ).toHaveValue("Tesis");
      },
    );
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });
    test("sets lots and kind through addresses, returns a changed preview, and confirms it", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "/stocks/BBCA/buy",
      });
      const ticket = page.locator("dialog[open]");
      await ticket.getByRole("link", { name: text.up, exact: true }).click();
      await expect(page).toHaveURL(/lots=2/);
      await expect(
        ticket.getByRole("textbox", { name: text.lots, exact: true }),
      ).toHaveValue("2");
      await ticket.getByRole("link", { name: text.limit, exact: true }).click();
      await expect(
        ticket.getByRole("textbox", { name: text.price, exact: true }),
      ).toBeVisible();
      await ticket
        .getByRole("link", { name: text.market, exact: true })
        .click();
      await ticket
        .getByRole("textbox", { name: text.lots, exact: true })
        .fill("3");
      await ticket.locator('button[type="submit"]').click();
      await expect(
        ticket.getByText(text.changed, { exact: true }),
      ).toBeVisible();
      await expect(ticket.locator('input[name="seenTotal"]')).toHaveValue(
        "1496241",
      );
      await ticket.locator('button[type="submit"]').click();
      await expect(
        page.getByRole("heading", { name: text.waiting, exact: true }),
      ).toBeVisible();
      await lecturer.context().close();
    });
  });
}
