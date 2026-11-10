import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { databaseWithClosesForTest } from "./measures-for-test.server";
import { readStockRows } from "./read-measures.server";
import { StockTable } from "./stock-table";

// BBCA has the expected return of -0.001023, the standard deviation of 0.052272, and the beta of 0.689371 that the decimal module of Python computed, as measure-stock.test.ts gives them. AADI listed in December 2024, and the database stores no closes of ADMR.
const texts: Record<
  Locale,
  {
    header: readonly string[];
    bbca: readonly string[];
    aadi: string;
    admr: string;
  }
> = {
  id: {
    header: [
      "Saham",
      "Imbal hasil yang diharapkan",
      "Simpangan baku",
      "Beta terhadap IHSG",
    ],
    bbca: ["-0,10%", "5,23%", "0,69"],
    aadi: "21 dari 24 imbal hasil bulanan yang dibutuhkan ukuran",
    admr: "0 dari 24 imbal hasil bulanan yang dibutuhkan ukuran",
  },
  en: {
    header: [
      "Stock",
      "Expected return",
      "Standard deviation",
      "Beta against the IHSG",
    ],
    bbca: ["-0.10%", "5.23%", "0.69"],
    aadi: "21 of the 24 monthly returns that the measures need",
    admr: "0 of the 24 monthly returns that the measures need",
  },
};

function codeCell(code: string): string {
  return `<th scope="row"><a href="/classes/7/measures/${code}" data-discover="true">${code}</a></th>`;
}

for (const locale of locales) {
  test(`shows the expected return, the standard deviation, and the beta of each stock, or in short why a stock has none, each with a link to its page, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    const html = renderInRouterForTest(
      <StockTable
        classId={7 as ClassId}
        stocks={readStockRows(databaseWithClosesForTest())}
      />,
    ).replaceAll(/ class="[^"]*"/g, "");
    for (const part of [
      `<thead><tr>${text.header.map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>`,
      `<tr>${codeCell("BBCA")}${text.bbca.map((value) => `<td>${value}</td>`).join("")}</tr>`,
      `<tr>${codeCell("AADI")}<td colSpan="3">${text.aadi}</td></tr>`,
      `<tr>${codeCell("ADMR")}<td colSpan="3">${text.admr}</td></tr>`,
    ]) {
      expect(html).toContain(part);
    }
  });
}
