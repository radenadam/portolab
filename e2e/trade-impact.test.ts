import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { layoutProblems } from "./expect-layout.ts";
import { tradeImpactStudent } from "./trade-impact-student.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";

const texts: Record<
  Locale,
  {
    title: string;
    share: string;
    open: string;
    help: string;
    lesson: string;
    lessonTitle: string;
    lots: string;
    reason: string;
    axis: string;
    ticketAxis: string;
    risk: string;
    beta: string;
    rows: readonly (readonly [string, string])[];
    comparison: string;
    eleven: string;
    zero: string;
    zeroWeight: string;
    months: string;
    tooFew: string;
    cap: string;
  }
> = {
  id: {
    title: "Dampak ke portofolio",
    share: "Bagian portofolio",
    open: "Buka tiket dengan 10 lot",
    help: "Apa itu Dampak ke portofolio?",
    lesson: "Pelajari lebih lanjut di sesi 2",
    lessonTitle: "Teori portofolio",
    lots: "Jumlah lot",
    reason: "Alasan (opsional)",
    axis: "Sumbu risiko dampak order",
    ticketAxis: "Sumbu risiko dampak order di tiket",
    risk: "Simpangan baku",
    beta: "Beta",
    rows: [
      ["0,62", "0,68"],
      ["4,07%", "4,50%"],
      ["-0,22%", "-0,23%"],
      ["50,0%", "59,1%"],
      ["50,0%", "59,1%"],
    ],
    comparison: "Beta 0,62 menjadi 0,68.",
    eleven: "0,69",
    zero: "0,00",
    zeroWeight: "0,0%",
    months:
      "Portofolio Anda memakai 60 bulan. Perbandingan ini memakai 38 imbal hasil bulanan yang sama sebelum dan sesudah order, dari Agustus 2023 sampai September 2026, karena mencakup saham order ini.",
    tooFew: "Saham Anda dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan",
    cap: "50.000",
  },
  en: {
    title: "Portfolio impact",
    share: "Share of portfolio",
    open: "Open ticket with 10 lots",
    help: "What is Portfolio impact?",
    lesson: "Learn more in session 2",
    lessonTitle: "Portfolio theory",
    lots: "Lots",
    reason: "Reason (optional)",
    axis: "Trade impact risk axis",
    ticketAxis: "Ticket trade impact risk axis",
    risk: "Standard deviation",
    beta: "Beta",
    rows: [
      ["0.62", "0.68"],
      ["4.07%", "4.50%"],
      ["-0.22%", "-0.23%"],
      ["50.0%", "59.1%"],
      ["50.0%", "59.1%"],
    ],
    comparison: "Beta 0.62 becomes 0.68.",
    eleven: "0.69",
    zero: "0.00",
    zeroWeight: "0.0%",
    months:
      "Your portfolio uses 60 months. This comparison uses the same 38 monthly returns before and after the order, from August 2023 to September 2026, because it includes the stock of this order.",
    tooFew: "Your stocks and the IHSG share 0 monthly returns",
    cap: "50,000",
  },
};

// Python Decimal independently computed the portfolio's values from the recorded month-end closes, as preview-trade.test.ts describes.
async function expectRows(
  section: Locator,
  rows: readonly (readonly [string, string])[],
) {
  const drawn = section.locator("[data-impact-rows] > div");
  await expect(drawn).toHaveCount(rows.length);
  for (const [index, [before, after]] of rows.entries()) {
    await expect(drawn.nth(index).locator(":scope > span").nth(1)).toHaveText(
      before,
    );
    await expect(drawn.nth(index).locator(":scope > strong")).toContainText(
      after,
    );
  }
}

for (const locale of locales) {
  const text = texts[locale];
  test(`previews a portfolio share and keeps a typed ticket while its map and help change in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await tradeImpactStudent(page, browser, {
      locale,
      kind: "diversified",
    });
    const path = `${classPath}/stocks/BBCA`;
    await student.goto(path);
    const impact = student.locator("#impact");
    await expect(
      impact.getByRole("heading", { name: text.title, exact: true }),
    ).toBeVisible();
    await expectRows(impact, text.rows);
    await expect(
      impact.getByText(text.comparison, { exact: true }),
    ).toHaveCount(1);
    const choices = impact.getByRole("navigation", { name: text.share });
    await expect(choices.getByRole("link")).toHaveText(["5%", "10%", "20%"]);
    await choices.getByRole("link", { name: "20%", exact: true }).click();
    await expect(student).toHaveURL(/impact=0.2/);
    await choices.getByRole("link", { name: "10%", exact: true }).click();
    await expectRows(impact, text.rows);
    await impact.getByRole("link", { name: text.open, exact: true }).click();
    const ticket = student.locator("dialog[open]");
    await expect(
      ticket.locator('form[data-ticket-ready="true"]'),
    ).toBeVisible();
    const lots = ticket.getByRole("textbox", { name: text.lots, exact: true });
    await expect(lots).toHaveValue("10");
    await lots.fill("11");
    await ticket
      .getByLabel(text.reason, { exact: true })
      .fill("Tesis tetap tersimpan.");
    await expect(
      ticket
        .locator("[data-impact-rows] > div")
        .first()
        .locator(":scope > strong"),
    ).toContainText(text.eleven);
    const axis = ticket.getByRole("navigation", { name: text.ticketAxis });
    for (const [label, value] of [
      [text.risk, "risk"],
      [text.beta, "beta"],
    ] as const) {
      await axis.getByRole("link", { name: label, exact: true }).click();
      await expect(student).toHaveURL(new RegExp(`impactAxis=${value}`, "u"));
      await expect(axis.locator('a[aria-current="true"]')).toHaveText(label);
      await expect(lots).toHaveValue("11");
      await expect(ticket.getByLabel(text.reason, { exact: true })).toHaveValue(
        "Tesis tetap tersimpan.",
      );
    }
    await ticket.getByRole("button", { name: text.help, exact: true }).click();
    const help = student.locator("[popover]:popover-open");
    await expect(help).toBeVisible();
    await student.keyboard.press("Escape");
    await expect(lots).toHaveValue("11");
    await lots.fill("10");
    await expect(
      ticket
        .locator("[data-impact-rows] > div")
        .first()
        .locator(":scope > strong"),
    ).toContainText(text.rows[0]?.[1] ?? "");
    const pointValues = ticket.locator("summary:visible").first();
    await pointValues.click();
    await expect(ticket.locator("table:visible")).toHaveCount(1);
    expect(await layoutProblems(student)).toEqual([]);
    await pointValues.click();
    await student.context().close();
  });

  test(`keeps a typed impact ticket while its lesson opens in place in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await tradeImpactStudent(page, browser, {
      locale,
      kind: "diversified",
    });
    const path = `${classPath}/stocks/BBCA/buy?lots=10`;
    await student.goto(path);
    await expect(
      student.locator('dialog form[data-ticket-ready="true"]'),
    ).toBeVisible();
    const ticket = student.locator("dialog[open]");
    const lots = ticket.getByRole("textbox", { name: text.lots, exact: true });
    const reason = ticket.getByLabel(text.reason, { exact: true });
    await lots.fill("11");
    await reason.fill("Tesis tetap tersimpan.");
    await ticket.getByRole("button", { name: text.help, exact: true }).click();
    const more = student
      .locator("[popover]:popover-open")
      .getByRole("link", { name: text.lesson, exact: true });
    await more.click();
    const lesson = student.getByRole("dialog", {
      name: text.lessonTitle,
      exact: true,
    });
    await expect(lesson).toBeVisible();
    await expect(student).toHaveURL(path);
    await student.keyboard.press("Escape");
    await expect(lesson).toHaveCount(0);
    await expect(more).toBeFocused();
    await expect(lots).toHaveValue("11");
    await expect(reason).toHaveValue("Tesis tetap tersimpan.");
    await expect(
      ticket
        .locator("[data-impact-rows] > div")
        .first()
        .locator(":scope > strong"),
    ).toContainText(text.eleven);
    await student.context().close();
  });

  test(`names the common months in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await tradeImpactStudent(page, browser, {
      locale,
      kind: "diversified",
    });
    await student.goto(`${classPath}/stocks/AMMN/buy?lots=10`);
    await expect(
      student.locator("dialog").getByText(text.months, { exact: true }),
    ).toBeVisible();
    await student.context().close();
  });

  test(`shows cash alone after selling the last holding in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await tradeImpactStudent(page, browser, {
      locale,
      kind: "lastHolding",
    });
    await student.goto(`${classPath}/stocks/BBCA/sell?lots=10`);
    const rows = student.locator("dialog [data-impact-rows] > div");
    await expect(rows).toHaveCount(5);
    for (const [index, suffix] of ["", "%", "%", "%", "%"].entries())
      await expect(rows.nth(index).locator(":scope > strong")).toContainText(
        index < 3 ? `${text.zero}${suffix}` : text.zeroWeight,
      );
    await student.context().close();
  });

  test(`explains a portfolio without measures and a draft without cash in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await tradeImpactStudent(page, browser, {
      locale,
      kind: "unmeasured",
    });
    await student.goto(`${classPath}/stocks/BBCA/buy?lots=10`);
    const impact = student.locator(
      'dialog section[aria-labelledby~="ticket-impact-title"]',
    );
    await expect(impact).toContainText(text.tooFew);
    await expect(impact.locator("svg")).toHaveCount(0);
    await student.goto(`${classPath}/stocks/BBCA/buy?lots=30`);
    await expect(impact).not.toContainText(text.tooFew);
    await expect(impact.locator("svg")).toHaveCount(0);
    await student.context().close();
  });

  test.describe(`without JavaScript in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });
    test("draws the map and carries a portfolio share into the ticket", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "/stocks/BBCA",
      });
      const impact = page.locator("#impact");
      await expect(impact.locator("svg").first()).toBeVisible();
      await impact
        .getByRole("navigation", { name: text.share })
        .getByRole("link", { name: "20%", exact: true })
        .click();
      await expect(page).toHaveURL(/impact=0.2/);
      await impact
        .getByRole("navigation", { name: text.axis })
        .getByRole("link", { name: text.risk, exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("impactAxis") === "risk" &&
          url.hash === "#impact",
      );
      await expect(impact).toBeInViewport();
      const heading = await impact
        .getByRole("heading", { name: text.title, exact: true })
        .boundingBox();
      const topBar = await page.getByRole("banner").boundingBox();
      if (heading === null || topBar === null)
        throw new Error("The impact heading and top bar have visible boxes.");
      expect(heading.y).toBeGreaterThanOrEqual(topBar.y + topBar.height);
      await impact.locator("a").last().click();
      await expect(page.locator('dialog input[name="lots"]')).toHaveValue(
        text.cap,
      );
      await expect(page.locator("dialog [data-impact-rows] > div")).toHaveCount(
        5,
      );
      await page
        .locator("dialog")
        .getByRole("navigation", { name: text.ticketAxis })
        .getByRole("link", { name: text.beta, exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get("impactAxis") === "beta" &&
          url.hash === "#ticket-impact",
      );
      await expect(page.locator('dialog input[name="lots"]')).toHaveValue(
        text.cap,
      );
      await lecturer.context().close();
    });
  });
}
