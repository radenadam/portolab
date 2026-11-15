import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { stockReturnDestination } from "./stock-return-destination.server";

const texts: Record<Locale, { analysis: string; market: string }> = {
  id: { analysis: "Kembali ke Analisis", market: "Kembali ke Pasar" },
  en: { analysis: "Back to Analysis", market: "Back to Market" },
};
const paths: Record<PortfolioKind, string> = {
  membership: "/classes/7/analysis",
  demonstration: "/classes/7/demonstration/analysis",
};

for (const locale of locales) {
  test(`returns a stock to its owner's analysis and exact source, while refusing another owner or class, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const portfolioKind of ["membership", "demonstration"] as const) {
      const read = (returnTo: string | undefined) => {
        const url = new URL("http://localhost:3000/classes/7/stocks/BBCA");
        if (returnTo !== undefined) url.searchParams.set("returnTo", returnTo);
        return stockReturnDestination({
          classId: 7 as ClassId,
          portfolioKind,
          url,
          request: new Request(url),
        });
      };
      for (const path of Object.values(paths)) {
        const source = `${path}?axis=risk&data=stocks#stock-BBCA`;
        expect(read(source)).toEqual(
          path === paths[portfolioKind]
            ? {
                returnTo: source,
                returnPath: source,
                returnLabel: texts[locale].analysis,
              }
            : {
                returnTo: undefined,
                returnPath: "/classes/7/market",
                returnLabel: texts[locale].market,
              },
        );
      }
      const market = "/classes/7/market?q=BBCA&sector=financials#market-BBCA";
      expect(read(market)).toEqual({
        returnTo: market,
        returnPath: market,
        returnLabel: texts[locale].market,
      });
      for (const source of [
        undefined,
        "/classes/8/market",
        "/classes/8/analysis",
        "/classes/8/demonstration/analysis",
        "/account",
      ]) {
        expect(read(source)).toEqual({
          returnTo: undefined,
          returnPath: "/classes/7/market",
          returnLabel: texts[locale].market,
        });
      }
    }
  });
}
