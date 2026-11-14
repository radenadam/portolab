import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { Sector } from "./company-of";
import { StockName } from "./stock-name";

/** A stock of the universe, with the tile and the name of its company, and the name that IDX gives the sector of the company in each language. */
interface StockOfSector {
  code: string;
  tile: string;
  name: string;
  sector: Record<Locale, string>;
}

// A stock in each sector of IDX-IC that the universe has.
const stocksOfSectors: Record<Sector, StockOfSector> = {
  energy: {
    code: "AADI",
    tile: "AA",
    name: "Adaro Andalan Indonesia Tbk",
    sector: { id: "Energi", en: "Energy" },
  },
  basicMaterials: {
    code: "AMMN",
    tile: "AM",
    name: "Amman Mineral Internasional Tbk",
    sector: { id: "Barang Baku", en: "Basic Materials" },
  },
  industrials: {
    code: "ASII",
    tile: "AS",
    name: "Astra International Tbk",
    sector: { id: "Perindustrian", en: "Industrials" },
  },
  consumerNonCyclicals: {
    code: "AMRT",
    tile: "AM",
    name: "Sumber Alfaria Trijaya Tbk",
    sector: { id: "Barang Konsumen Primer", en: "Consumer Non-Cyclicals" },
  },
  consumerCyclicals: {
    code: "HRTA",
    tile: "HR",
    name: "Hartadinata Abadi Tbk",
    sector: { id: "Barang Konsumen Non-Primer", en: "Consumer Cyclicals" },
  },
  healthcare: {
    code: "KLBF",
    tile: "KL",
    name: "Kalbe Farma Tbk",
    sector: { id: "Kesehatan", en: "Healthcare" },
  },
  financials: {
    code: "BBCA",
    tile: "BB",
    name: "Bank Central Asia Tbk",
    sector: { id: "Keuangan", en: "Financials" },
  },
  technology: {
    code: "GOTO",
    tile: "GO",
    name: "GoTo Gojek Tokopedia Tbk",
    sector: { id: "Teknologi", en: "Technology" },
  },
  infrastructures: {
    code: "TLKM",
    tile: "TL",
    name: "Telkom Indonesia (Persero) Tbk",
    sector: { id: "Infrastruktur", en: "Infrastructures" },
  },
};

/** The markup of a stock without the names of the classes of CSS modules, which carry a hash. */
function renderStock(code: string, withSector: boolean): string {
  return renderToStaticMarkup(
    <StockName code={code} withSector={withSector} />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

for (const locale of locales) {
  test(`shows the sector of the company of a stock in each sector of IDX-IC under the name of the company, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const { code, tile, name, sector } of Object.values(stocksOfSectors)) {
      expect(renderStock(code, true), code).toBe(
        `<div><span aria-hidden="true">${tile}</span><div><span>${code}</span><span>${name}</span><span>${sector[locale]}</span></div></div>`,
      );
    }
  });
}

test("shows the first two letters of the code in a tile that screen readers skip, beside the code and the name of the company, without the sector unless the screen asks for it", () => {
  expect(renderStock("BBRI", false)).toBe(
    '<div><span aria-hidden="true">BB</span><div><span>BBRI</span><span>Bank Rakyat Indonesia (Persero) Tbk</span></div></div>',
  );
});
