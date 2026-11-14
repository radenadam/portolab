import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectTexts } from "./expect-texts.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { createMarketClass } from "./create-market-class.ts";
import { chooseLanguage } from "./choose-language.ts";

// The server runs with the fixture price source, and fixture-price-source.server.ts describes its quotes. ITMG has the highest price of the universe, the quotes of GOTO and BMRI hold the widest change and a date from an earlier day, and the table names the company of every stock with a price, so it holds the widest content of each column. Every update lacks UNVR, whose quote the global setup stored before the server started, and WIFI, of which Portolab has no price. The notice of those prices is a tuple of its parts around the time of the latest update, and the time of the next attempt depends on the moment of the test.
// The expected changes of ERAA, GGRM, and PWON were computed from the fixture closes with Python's decimal module and ROUND_HALF_UP, so they check the rounded signs independently.

const texts: Record<
  Locale,
  {
    title: string;
    failureNotice: readonly [string, string, string];
    columns: readonly string[];
    bbca: readonly string[];
    ihsg: readonly string[];
    tlkm: readonly string[];
    bmri: readonly string[];
    goto: readonly string[];
    itmg: readonly string[];
    wifi: string;
  }
> = {
  id: {
    title: "Pasar",
    wifi: "Portolab belum memiliki harga WIFI.",
    failureNotice: [
      "Portolab tidak dapat memperbarui harga UNVR pada ",
      " WIB, jadi Portolab memakai harga terakhir UNVR yang tersimpan. Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada ",
      " WIB gagal. Portolab ",
    ],
    columns: [
      "Saham",
      "Sektor",
      "1 bulan",
      "Harga",
      "Perubahan",
      "Beta",
      "Volatilitas/bln",
    ],
    bbca: [
      "Bank Central Asia Tbk",
      "Keuangan",
      "4.980",
      "▲",
      "+0,81%",
      "16.14",
    ],
    ihsg: ["5.057,05", "▼", "-0,80%", "16.00"],
    tlkm: ["1.980", "0,00%", "16.14"],
    bmri: ["3.720", "29 Okt 2026", "16.14"],
    goto: [
      "GoTo Gojek Tokopedia Tbk",
      "Teknologi",
      "24",
      "▲",
      "+33,33%",
      "16.14",
    ],
    itmg: [
      "Indo Tambangraya Megah Tbk",
      "Energi",
      "24.900",
      "▲",
      "+1,22%",
      "16.10",
    ],
  },
  en: {
    title: "Market",
    wifi: "Portolab has no price for WIFI yet.",
    failureNotice: [
      "Portolab could not update the price of UNVR at ",
      " WIB, so it uses the last price of UNVR that it stored. Portolab has no price for WIFI yet, because its latest attempt to fetch it at ",
      " WIB failed. Portolab ",
    ],
    columns: [
      "Stock",
      "Sector",
      "1 month",
      "Price",
      "Change",
      "Beta",
      "Volatility/month",
    ],
    bbca: [
      "Bank Central Asia Tbk",
      "Financials",
      "IDR 4,980",
      "▲",
      "+0.81%",
      "4:14 PM",
    ],
    ihsg: ["5,057.05", "▼", "-0.80%", "4:00 PM"],
    tlkm: ["IDR 1,980", "0.00%", "4:14 PM"],
    bmri: ["IDR 3,720", "Oct 29, 2026", "4:14 PM"],
    goto: [
      "GoTo Gojek Tokopedia Tbk",
      "Technology",
      "IDR 24",
      "▲",
      "+33.33%",
      "4:14 PM",
    ],
    itmg: [
      "Indo Tambangraya Megah Tbk",
      "Energy",
      "IDR 24,900",
      "▲",
      "+1.22%",
      "4:10 PM",
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`shows delayed prices with the companies and the sectors of the stocks, their changes, signs, arrows, and times in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const testClass = await createMarketClass(page);
    await page.goto(`${testClass.path}/market`);
    await expect(page).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.title }),
    ).toBeVisible();
    // The card of the badge of the simulation names the same prices, so the test reads the notice of the page.
    await expectTexts(
      page.getByRole("main").getByText(text.failureNotice[0]),
      text.failureNotice,
    );
    for (const column of text.columns) {
      await expect(
        page.locator("section[aria-labelledby=stocks-heading] thead"),
      ).toContainText(column);
    }
    for (const [code, cells] of [
      ["BBCA", text.bbca],
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
    await expectTexts(
      page.getByRole("region", { name: "IHSG", exact: true }),
      text.ihsg,
    );
    await expect(page.getByRole("row", { name: /WIFI/ })).toContainText(
      text.wifi,
    );
    await expectAccessibleScreen(page);
  });
}

// Decision 0012 explains why Portolab serves its fonts itself. A browser downloads only the faces whose text a page shows, so the test loads every face that the page declares.
test("loads both fonts from Portolab itself", async ({ page }) => {
  const requestedUrls: string[] = [];
  page.on("request", (request) => {
    requestedUrls.push(request.url());
  });
  await page.goto("/sign-in");
  const loadedFamilies = await page.evaluate(async () => {
    const faces = await Promise.all(
      Array.from(document.fonts, (face) => face.load()),
    );
    return [...new Set(faces.map((face) => face.family))].sort();
  });
  expect(loadedFamilies).toEqual(["DM Mono", "Instrument Sans Variable"]);
  const pageOrigin = new URL(page.url()).origin;
  expect(
    requestedUrls.filter((url) => new URL(url).origin !== pageOrigin),
  ).toEqual([]);
});
