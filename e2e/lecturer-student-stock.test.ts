import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { selectFirstStudent } from "./select-first-student.ts";
import { studentDesignClass } from "./student-design-class.ts";
import { expectStockRangeReturn } from "./expect-stock-range-return.ts";

const sources = ["holdings", "map", "analysis", "journal", "orders"] as const;
type StockSource = (typeof sources)[number];
const texts: Record<
  Locale,
  {
    open: string;
    back: string;
    mapTable: string;
    measures: string;
    calculation: string;
    data: string;
    range: string;
    month: string;
    returns: Record<StockSource, string>;
  }
> = {
  id: {
    open: "Buka portofolio",
    back: "Kembali ke mahasiswa",
    mapTable: "Tabel titik pada peta",
    measures: "Ukuran portofolio Raka",
    calculation: "Lihat perhitungan",
    data: "Data dan metode",
    range: "Rentang grafik harga",
    month: "1B",
    returns: {
      holdings: "Kembali ke Ringkasan mahasiswa",
      map: "Kembali ke Ringkasan mahasiswa",
      analysis: "Kembali ke Analisis mahasiswa",
      journal: "Kembali ke Jurnal dan order mahasiswa",
      orders: "Kembali ke Jurnal dan order mahasiswa",
    },
  },
  en: {
    open: "Open portfolio",
    back: "Back to students",
    mapTable: "Table of map points",
    measures: "Portfolio measures of Raka",
    calculation: "View calculation",
    data: "Data and method",
    range: "Price chart range",
    month: "1M",
    returns: {
      holdings: "Back to student Summary",
      map: "Back to student Summary",
      analysis: "Back to student Analysis",
      journal: "Back to student Journal and orders",
      orders: "Back to student Journal and orders",
    },
  },
};

for (const locale of locales) {
  for (const javaScriptEnabled of [true, false]) {
    test.describe(`student stock returns with JavaScript ${String(javaScriptEnabled)} in ${languageNames[locale]}`, () => {
      test.use({ javaScriptEnabled });
      for (const source of sources) {
        test(`returns from a stock to the selected student and ${source} row`, async ({
          page,
          browser,
        }, info) => {
          const text = texts[locale];
          const { student, classPath } = await studentDesignClass(
            page,
            browser,
            locale,
          );
          try {
            await page.goto(`${classPath}/students?measure=treynor&q=Raka`);
            await selectFirstStudent(page);
            const selected = new URL(page.url());
            selected.hash = "selected-student";
            await page
              .getByRole("dialog")
              .getByRole("link", { name: text.open, exact: true })
              .click();
            const address = new URL(page.url());
            let link: Locator;
            switch (source) {
              case "holdings":
                link = page.locator(
                  `#home-holding-${info.project.name === "phone" ? "phone" : "desktop"}-BBCA`,
                );
                break;
              case "map":
                await page.getByText(text.mapTable, { exact: true }).click();
                link = page.locator("#home-map-BBCA");
                break;
              case "analysis":
                address.pathname += "/analysis";
                address.searchParams.set("axis", "risk");
                await page.goto(address.href);
                await page
                  .getByRole("region", { name: text.measures, exact: true })
                  .getByRole("button", { name: text.calculation, exact: true })
                  .first()
                  .click();
                await page
                  .locator("#analysis-expectedReturn")
                  .getByRole("button", { name: text.data, exact: true })
                  .click();
                address.searchParams.set("data", "stocks");
                link = page.locator("#stock-BBCA");
                break;
              case "journal":
              case "orders":
                address.pathname += "/journal";
                address.searchParams.set("view", source);
                address.searchParams.set(
                  "status",
                  source === "orders" ? "rejected" : "all",
                );
                await page.goto(address.href);
                link = page
                  .locator(
                    source === "orders"
                      ? 'a[id^="order-"]'
                      : 'a[id^="journal-"]',
                  )
                  .first();
                break;
            }
            const anchor = await link.getAttribute("id");
            if (anchor === null)
              throw new Error("The stock link must identify its return row.");
            address.hash = anchor;
            const returnTo = address.pathname + address.search + address.hash;
            await link.click();
            await expect(page).toHaveURL(
              (url) =>
                url.pathname === `${classPath}/stocks/BBCA` &&
                url.searchParams.get("returnTo") === returnTo,
            );
            await expectStockRangeReturn(page, {
              returnTo,
              range: text.range,
              month: text.month,
              back: text.returns[source],
            });
            await page
              .getByRole("link", { name: text.back, exact: true })
              .click();
            await expect(page).toHaveURL(selected.href);
          } finally {
            await student.context().close();
          }
        });
      }
    });
  }
}
