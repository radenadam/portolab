import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectTexts } from "./expect-texts.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { trackedInstruments } from "../app/features/market-data/tracked-instruments.ts";
import { chooseLanguage } from "./choose-language.ts";

// The server runs with the fixture price source, and fixture-price-source.server.ts describes its quotes. ITMG has the highest price of the universe, and the quotes of GOTO and BMRI hold the widest change and a date from an earlier day, so the table holds the widest content of each column. Every update lacks UNVR, whose quote the global setup stored before the server started, and WIFI, of which Portolab has no price. The notice of those prices is a tuple of its parts around the time of the latest update, and the time of the next attempt depends on the moment of the test.

const texts: Record<
  Locale,
  {
    title: string;
    delayNotice: string;
    failureNotice: readonly [string, string, string];
    columns: readonly string[];
    bbca: readonly string[];
    ihsg: readonly string[];
    tlkm: readonly string[];
    bmri: readonly string[];
    goto: readonly string[];
    itmg: readonly string[];
  }
> = {
  id: {
    title: "Harga saham",
    delayNotice:
      "Harga tertunda sekitar 10 menit dan berasal dari Yahoo Finance. Harga terakhir tercatat pada 30 Okt 2026, 16.14 WIB.",
    failureNotice: [
      "Portolab tidak dapat memperbarui harga UNVR pada ",
      " WIB, jadi Portolab memakai harga terakhir UNVR yang tersimpan. Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada ",
      " WIB gagal. Portolab ",
    ],
    columns: ["Kode", "Harga terakhir", "Perubahan", "Waktu (WIB)"],
    bbca: ["4.980", "▲", "+0,81%", "16.14"],
    ihsg: ["5.057,05", "▼", "-0,80%", "16.00"],
    tlkm: ["1.980", "0,00%", "16.14"],
    bmri: ["3.720", "29 Okt 2026", "16.14"],
    goto: ["24", "▲", "+33,33%", "16.14"],
    itmg: ["24.900", "▲", "+1,22%", "16.10"],
  },
  en: {
    title: "Stock prices",
    delayNotice:
      "Prices are delayed by about 10 minutes and come from Yahoo Finance. The latest price was recorded at Oct 30, 2026, 4:14 PM WIB.",
    failureNotice: [
      "Portolab could not update the price of UNVR at ",
      " WIB, so it uses the last price of UNVR that it stored. Portolab has no price for WIFI yet, because its latest attempt to fetch it at ",
      " WIB failed. Portolab ",
    ],
    columns: ["Code", "Last price", "Change", "Time (WIB)"],
    bbca: ["IDR 4,980", "▲", "+0.81%", "4:14 PM"],
    ihsg: ["5,057.05", "▼", "-0.80%", "4:00 PM"],
    tlkm: ["IDR 1,980", "0.00%", "4:14 PM"],
    bmri: ["IDR 3,720", "Oct 29, 2026", "4:14 PM"],
    goto: ["IDR 24", "▲", "+33.33%", "4:14 PM"],
    itmg: ["IDR 24,900", "▲", "+1.22%", "4:10 PM"],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`shows delayed prices with their changes, signs, arrows, and times in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/prices");
    await expect(page).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.title }),
    ).toBeVisible();
    await expect(page.getByText(text.delayNotice)).toBeVisible();
    await expectTexts(
      page.getByText(text.failureNotice[0]),
      text.failureNotice,
    );
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
      ["GOTO", text.goto],
      ["ITMG", text.itmg],
    ] as const) {
      await expectTexts(
        page.getByRole("row", { name: new RegExp(code) }),
        cells,
      );
    }
    // The header and a row for each tracked instrument but WIFI, of which Portolab has no price.
    const headerRows = 1;
    const unpricedInstruments = 1;
    await expect(page.getByRole("row")).toHaveCount(
      headerRows + trackedInstruments.length - unpricedInstruments,
    );
    await expectAccessibleScreen(page);
  });
}

test("aligns every number and time of the table to the right in the font for numbers", async ({
  page,
}) => {
  await page.goto("/prices");
  const cells = page.getByRole("row", { name: /BBCA/ }).getByRole("cell");
  await expect(cells).toHaveCount(3);
  for (const cell of await cells.all()) {
    await expect(cell).toHaveCSS("text-align", "right");
    await expect(cell).toHaveCSS("font-family", /^"IBM Plex Mono",/);
  }
});

// Decision 0012 explains why Portolab serves its fonts itself.
test("loads both fonts from Portolab itself", async ({ page }) => {
  const requestedUrls: string[] = [];
  page.on("request", (request) => {
    requestedUrls.push(request.url());
  });
  await page.goto("/prices");
  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready;
    const families = new Set<string>();
    for (const face of document.fonts) {
      if (face.status === "loaded") {
        families.add(face.family);
      }
    }
    return [...families].sort();
  });
  expect(loadedFamilies).toEqual(["IBM Plex Mono", "IBM Plex Sans Variable"]);
  const pageOrigin = new URL(page.url()).origin;
  expect(
    requestedUrls.filter((url) => new URL(url).origin !== pageOrigin),
  ).toEqual([]);
});
