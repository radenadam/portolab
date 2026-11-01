import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";

// The server runs with the fixture price source, which returns the closing quotes of 30 October 2026.

const texts: Record<
  Locale,
  {
    title: string;
    delayNotice: string;
    columns: readonly string[];
    bbca: readonly string[];
    ihsg: readonly string[];
    tlkm: readonly string[];
    bmri: readonly string[];
  }
> = {
  id: {
    title: "Harga saham",
    delayNotice:
      "Harga tertunda sekitar 10 menit dan berasal dari Yahoo Finance. Harga terakhir tercatat pada 30 Okt 2026, 16.14 WIB.",
    columns: ["Kode", "Harga terakhir", "Perubahan", "Waktu (WIB)"],
    bbca: ["4.980", "+0,81%", "16.14"],
    ihsg: ["5.057,05", "-0,80%", "16.00"],
    tlkm: ["1.980", "0,00%", "16.14"],
    bmri: ["3.720", "29 Okt 2026", "16.14"],
  },
  en: {
    title: "Stock prices",
    delayNotice:
      "Prices are delayed by about 10 minutes and come from Yahoo Finance. The latest price was recorded at Oct 30, 2026, 4:14 PM WIB.",
    columns: ["Code", "Last price", "Change", "Time (WIB)"],
    bbca: ["IDR 4,980", "+0.81%", "4:14 PM"],
    ihsg: ["5,057.05", "-0.80%", "4:00 PM"],
    tlkm: ["IDR 1,980", "0.00%", "4:14 PM"],
    bmri: ["IDR 3,720", "Oct 29, 2026", "4:14 PM"],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`shows delayed prices with their changes and times in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/prices");
    await expect(page).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.title }),
    ).toBeVisible();
    await expect(page.getByText(text.delayNotice)).toBeVisible();
    for (const column of text.columns) {
      await expect(
        page.getByRole("columnheader", { name: column }),
      ).toBeVisible();
    }
    for (const [code, cells] of [
      ["BBCA", text.bbca],
      ["IHSG", text.ihsg],
      ["TLKM", text.tlkm],
      ["BMRI", text.bmri],
    ] as const) {
      const row = page.getByRole("row", { name: new RegExp(code) });
      for (const cell of cells) {
        await expect(row, code).toContainText(cell);
      }
    }
    await expectAccessibleScreen(page);
  });
}

test("shows each change in price with a sign and an arrow", async ({
  page,
}) => {
  await page.goto("/prices");
  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("▲");
  await expect(bbca).toContainText("+");
  await expect(page.getByRole("row", { name: /IHSG/ })).toContainText("▼");
});

test("aligns every number and time of the table to the right", async ({
  page,
}) => {
  await page.goto("/prices");
  const cells = page.getByRole("row", { name: /BBCA/ }).getByRole("cell");
  await expect(cells).toHaveCount(3);
  for (const cell of await cells.all()) {
    await expect(cell).toHaveCSS("text-align", "right");
  }
});
