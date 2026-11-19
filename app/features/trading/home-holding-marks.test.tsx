import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { portfolioWeight } from "~/units/portfolio-weight";
import { WeightMark } from "./home-holding-marks";
import styles from "./home-portfolio.module.css";

// Cash fills from the other end of its track, which only its class draws.
const fills: Record<"stock" | "cash", string | undefined> = {
  stock: styles["stockWeight"],
  cash: styles["cashWeight"],
};

const weights: Record<Locale, readonly [string, string, string]> = {
  id: ["0,00%", "37,50%", "100,00%"],
  en: ["0.00%", "37.50%", "100.00%"],
};

for (const locale of locales) {
  test(`fills a share of the whole track equal to the weight, from the start for a stock and from the end for cash, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [index, value] of [0, 0.375, 1].entries()) {
      for (const kind of ["stock", "cash"] as const) {
        const html = renderInRouterForTest(
          <WeightMark value={portfolioWeight(value)} kind={kind} />,
        );
        expect(html).toContain(weights[locale][index]);
        expect(html).toContain(
          `<span class="${String(fills[kind])}" style="width:${String(value * 100)}%"></span>`,
        );
      }
    }
    expect(
      renderInRouterForTest(<WeightMark value={undefined} kind="cash" />),
    ).toBe("");
  });
}
