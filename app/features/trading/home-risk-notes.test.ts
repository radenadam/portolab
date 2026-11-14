import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { succeed, fail } from "~/result";
import { beta } from "~/units/beta";
import { sharpeRatio } from "~/units/sharpe-ratio";
import { portfolioAgainstMarketForTest } from "~/features/measures/portfolio-against-market-for-test";
import { homeRiskNotes } from "./home-risk-notes";

const texts: Record<
  Locale,
  {
    beta: readonly string[];
    sharpe: readonly string[];
    missing: string;
    negative: string;
  }
> = {
  id: {
    beta: [
      "Pasar 1,00. Portofolio Anda lebih tenang dari pasar.",
      "Pasar 1,00. Portofolio Anda bergerak seperti pasar.",
      "Pasar 1,00. Portofolio Anda lebih bergejolak dari pasar.",
    ],
    sharpe: [
      "IHSG 0,10. Imbal hasil per unit risiko Anda di bawah pasar.",
      "IHSG 0,10. Imbal hasil per unit risiko Anda sama dengan pasar.",
      "IHSG 0,10. Imbal hasil per unit risiko Anda di atas pasar.",
    ],
    missing: "IHSG 0,10.",
    negative:
      "Pasar 1,00. Portofolio Anda bergerak berlawanan arah dengan pasar.",
  },
  en: {
    beta: [
      "Market 1.00. Your portfolio moves less with the market.",
      "Market 1.00. Your portfolio moves like the market.",
      "Market 1.00. Your portfolio moves more with the market.",
    ],
    sharpe: [
      "IHSG 0.10. Your return per unit of risk is below the market.",
      "IHSG 0.10. Your return per unit of risk equals the market.",
      "IHSG 0.10. Your return per unit of risk is above the market.",
    ],
    missing: "IHSG 0.10.",
    negative:
      "Market 1.00. Your portfolio moves in the opposite direction to the market.",
  },
};

for (const locale of locales) {
  test(`compares beta and Sharpe after rounding and keeps the market reference without a portfolio ratio in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioAgainstMarketForTest();
    if (report.kind !== "measured")
      throw new Error("The fixture has measured returns.");
    const portfolio = successValueForTest(
      report.measures,
      "The fixture has measures",
    );
    const market = { ...portfolio.market, sharpeRatio: sharpeRatio(0.1) };
    for (const [index, betaValue, ratio] of [
      [0, 0.5, -0.2],
      [0, -0.0001, -0.2],
      [0, 0, -0.2],
      [1, 0.9999, 0.09999],
      [2, 1.5, 0.4],
    ] as const) {
      const notes = homeRiskNotes({
        ...portfolio,
        beta: beta(betaValue),
        market,
        sharpeRatio: succeed(sharpeRatio(ratio)),
      });
      expect(notes.beta).toBe(texts[locale].beta[index]);
      expect(notes.sharpe).toBe(texts[locale].sharpe[index]);
    }
    expect(homeRiskNotes({ ...portfolio, beta: beta(-2), market }).beta).toBe(
      texts[locale].negative,
    );
    expect(
      homeRiskNotes({
        ...portfolio,
        market,
        sharpeRatio: fail({ kind: "noPortfolioVariation" }),
      }).sharpe,
    ).toBe(texts[locale].missing);
  });
}
