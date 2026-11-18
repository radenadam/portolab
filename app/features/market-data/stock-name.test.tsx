import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { Sector } from "./company-of";
import { StockName } from "./stock-name";
import { createMemoryRouter, RouterProvider } from "react-router";

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
    code: "GGRM",
    tile: "GG",
    name: "Gudang Garam Tbk",
    sector: { id: "Barang Konsumen Primer", en: "Consumer Non-Cyclicals" },
  },
  consumerCyclicals: {
    code: "ERAA",
    tile: "ER",
    name: "Erajaya Swasembada Tbk",
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
  propertiesAndRealEstate: {
    code: "PWON",
    tile: "PW",
    name: "Pakuwon Jati Tbk",
    sector: {
      id: "Properti & Real Estat",
      en: "Properties & Real Estate",
    },
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
function renderStock(
  code: string,
  withSector: boolean,
  {
    withCompanyName = true,
    logos = [],
  }: { withCompanyName?: boolean; logos?: readonly string[] } = {},
): string {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        element: (
          <StockName
            code={code}
            withSector={withSector}
            withCompanyName={withCompanyName}
          />
        ),
      },
    ],
    { hydrationData: { loaderData: { root: { companyLogos: logos } } } },
  );
  return renderToStaticMarkup(<RouterProvider router={router} />)
    .replaceAll("&amp;", "&")
    .replaceAll(/ class="[^"]*"/g, "");
}

for (const locale of locales) {
  test(`uses the supplied logo beside the same company name and code in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const stock = renderStock("BBCA", false, { logos: ["BBCA"] });
    expect(stock).toContain('<img src="/company-logos/BBCA.png" alt=""/>');
    expect(stock).toContain(
      "<span>BBCA</span><span>Bank Central Asia Tbk</span>",
    );
    expect(renderStock("BBRI", false, { logos: ["BBCA"] })).not.toContain(
      "<img",
    );
  });
  test(`keeps the tile and code when a compact holding row omits the company name in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(renderStock("BBCA", false, { withCompanyName: false })).toBe(
      '<div><span aria-hidden="true">BB</span><div><span>BBCA</span></div></div>',
    );
  });
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
