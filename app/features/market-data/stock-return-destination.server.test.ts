import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { stockReturnDestination } from "./stock-return-destination.server";

function readDestination(
  returnTo: string | undefined,
  portfolioKind: PortfolioKind,
) {
  const url = new URL("https://portolab.example/classes/7/stocks/BBCA");
  if (returnTo !== undefined) url.searchParams.set("returnTo", returnTo);
  return stockReturnDestination({
    classId: 7 as ClassId,
    portfolioKind,
    url,
    request: new Request(url),
  });
}

const labels: Record<Locale, readonly string[]> = {
  id: [
    "Kembali ke Ringkasan mahasiswa",
    "Kembali ke Analisis mahasiswa",
    "Kembali ke Jurnal dan order mahasiswa",
  ],
  en: [
    "Back to student Summary",
    "Back to student Analysis",
    "Back to student Journal and orders",
  ],
};

for (const locale of locales) {
  test(`keeps each taught-student tab, query, and row for lecturers in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [index, suffix] of ["", "/analysis", "/journal"].entries()) {
      const returnTo = `/classes/7/students/9${suffix}?axis=risk&view=orders&status=rejected&returnTo=%2Fclasses%2F7%2Fstudents%3Fstudent%3D9%26measure%3Dtreynor#stock-BBCA`;
      expect(readDestination(returnTo, "demonstration")).toEqual({
        returnTo,
        returnPath: returnTo,
        returnLabel: labels[locale][index],
      });
      expect(readDestination(returnTo, "membership").returnTo).toBeUndefined();
    }
    for (const returnTo of [
      "/classes/8/students/9",
      "/classes/7/students/0",
      "/classes/7/students/09/analysis",
      "/classes/7/students/9/other",
      "/classes/7/students/999999999999999999999",
    ]) {
      expect(readDestination(returnTo, "demonstration").returnPath).toBe(
        "/classes/7/market",
      );
    }
  });
}

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
      const read = (returnTo: string | undefined) =>
        readDestination(returnTo, portfolioKind);
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
