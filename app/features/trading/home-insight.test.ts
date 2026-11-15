import { expect, test } from "vitest";
import {
  cashValuationForTest,
  aadiValuationForTest,
} from "~/features/measures/measures-for-test.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import { varianceShare } from "~/units/variance-share";
import { homeInsight, homeInsightData } from "./home-insight";
import type { HomeInsightData } from "./home-insight";
import { homePortfolioForTest } from "./home-portfolio-for-test";

type MeasuredHomeInsight = Extract<HomeInsightData, { kind: "measured" }>;
type InsightHolding = MeasuredHomeInsight["holdings"][number];

const cases = [
  "singleCash",
  "singleNoCash",
  "highCash",
  "highNoCash",
  "low",
  "risk",
  "sector",
  "beta",
  "noVariation",
  "negativeBeta",
] as const;
type Case = (typeof cases)[number];
const topics: Record<Locale, readonly [string, string, string]> = {
  id: ["Order", "Risiko", "Diversifikasi"],
  en: ["Orders", "Risk", "Diversification"],
};
const boundaryCash: Record<Locale, string> = {
  id: "BBCA satu-satunya saham Anda, dengan beta 0,50. Kas 5% menarik beta portofolio turun ke 0,48.",
  en: "BBCA is your only holding, with beta 0.50. Cash at 5% brings portfolio beta down to 0.48.",
};
const texts: Record<Locale, Record<Case | "empty" | "unmeasured", string>> = {
  id: {
    empty:
      "Setelah order beli Anda tereksekusi, saham Anda dapat ditempatkan di peta dengan beta dari riwayat harganya.",
    unmeasured:
      "Beta portofolio membutuhkan bobot dari harga tertunda dan imbal hasil bulanan yang cukup untuk setiap saham.",
    singleCash:
      "BBCA satu-satunya saham Anda, dengan beta 0,50. Kas 20% menarik beta portofolio turun ke 0,40.",
    singleNoCash: "BBCA satu-satunya saham Anda, dengan beta 0,50.",
    highCash:
      "TLKM memberi imbal hasil tertinggi dan juga beta tertinggi (1,50). Kas 40% menarik beta portofolio turun ke 0,60.",
    highNoCash:
      "TLKM memberi imbal hasil tertinggi dan juga beta tertinggi (1,50).",
    low: "BBCA memberi imbal hasil tertinggi walau betanya terendah (0,50). Dalam jangka pendek, imbal hasil tidak selalu mengikuti beta.",
    risk: "TLKM berbobot 30% tetapi menyumbang 60% varians portofolio Anda.",
    sector:
      "50% portofolio Anda ada di sektor Keuangan. Saham satu sektor cenderung bergerak searah.",
    beta: "Beta portofolio Anda 0,90 merangkum kepekaannya terhadap pasar selama periode ukuran, bukan janji imbal hasil.",
    noVariation:
      "Beta portofolio Anda 0,00 merangkum kepekaannya terhadap pasar selama periode ukuran, bukan janji imbal hasil.",
    negativeBeta: "BBCA satu-satunya saham Anda, dengan beta -0,50.",
  },
  en: {
    empty:
      "Once your purchase fills, your holding can appear on the map with beta from its price history.",
    unmeasured:
      "Portfolio beta needs weights from delayed prices and enough monthly returns for every holding.",
    singleCash:
      "BBCA is your only holding, with beta 0.50. Cash at 20% brings portfolio beta down to 0.40.",
    singleNoCash: "BBCA is your only holding, with beta 0.50.",
    highCash:
      "TLKM has the highest return and the highest beta (1.50). Cash at 40% brings portfolio beta down to 0.60.",
    highNoCash: "TLKM has the highest return and the highest beta (1.50).",
    low: "BBCA has the highest return despite the lowest beta (0.50). Short term returns do not always follow beta.",
    risk: "TLKM has a 30% weight but contributes 60% of your portfolio variance.",
    sector:
      "50% of your portfolio is in the Financials sector. Stocks in one sector tend to move together.",
    beta: "Your portfolio beta of 0.90 summarizes its sensitivity to the market over the measurement period, rather than promising a return.",
    noVariation:
      "Your portfolio beta of 0.00 summarizes its sensitivity to the market over the measurement period, rather than promising a return.",
    negativeBeta: "BBCA is your only holding, with beta -0.50.",
  },
};

const studentTexts: Record<
  Locale,
  Record<Case | "empty" | "unmeasured", string>
> = {
  id: {
    empty:
      "Setelah order beli Raka tereksekusi, saham Raka dapat ditempatkan di peta dengan beta dari riwayat harganya.",
    unmeasured:
      "Beta portofolio membutuhkan bobot dari harga tertunda dan imbal hasil bulanan yang cukup untuk setiap saham.",
    singleCash:
      "BBCA satu-satunya saham Raka, dengan beta 0,50. Kas 20% menarik beta portofolio turun ke 0,40.",
    singleNoCash: "BBCA satu-satunya saham Raka, dengan beta 0,50.",
    highCash:
      "TLKM memberi imbal hasil tertinggi dan juga beta tertinggi (1,50). Kas 40% menarik beta portofolio turun ke 0,60.",
    highNoCash:
      "TLKM memberi imbal hasil tertinggi dan juga beta tertinggi (1,50).",
    low: "BBCA memberi imbal hasil tertinggi walau betanya terendah (0,50). Dalam jangka pendek, imbal hasil tidak selalu mengikuti beta.",
    risk: "TLKM berbobot 30% tetapi menyumbang 60% varians portofolio Raka.",
    sector:
      "50% portofolio Raka ada di sektor Keuangan. Saham satu sektor cenderung bergerak searah.",
    beta: "Beta portofolio Raka 0,90 merangkum kepekaannya terhadap pasar selama periode ukuran, bukan janji imbal hasil.",
    noVariation:
      "Beta portofolio Raka 0,00 merangkum kepekaannya terhadap pasar selama periode ukuran, bukan janji imbal hasil.",
    negativeBeta: "BBCA satu-satunya saham Raka, dengan beta -0,50.",
  },
  en: {
    empty:
      "Once a purchase of Raka fills, a holding of Raka can appear on the map with beta from its price history.",
    unmeasured:
      "Portfolio beta needs weights from delayed prices and enough monthly returns for every holding.",
    singleCash:
      "BBCA is the only holding of Raka, with beta 0.50. Cash at 20% brings portfolio beta down to 0.40.",
    singleNoCash: "BBCA is the only holding of Raka, with beta 0.50.",
    highCash:
      "TLKM has the highest return and the highest beta (1.50). Cash at 40% brings portfolio beta down to 0.60.",
    highNoCash: "TLKM has the highest return and the highest beta (1.50).",
    low: "BBCA has the highest return despite the lowest beta (0.50). Short term returns do not always follow beta.",
    risk: "TLKM has a 30% weight but contributes 60% of the variance of the portfolio of Raka.",
    sector:
      "50% of the portfolio of Raka is in the Financials sector. Stocks in one sector tend to move together.",
    beta: "Beta 0.90 for the portfolio of Raka summarizes its sensitivity to the market over the measurement period, rather than promising a return.",
    noVariation:
      "Beta 0.00 for the portfolio of Raka summarizes its sensitivity to the market over the measurement period, rather than promising a return.",
    negativeBeta: "BBCA is the only holding of Raka, with beta -0.50.",
  },
};

const portfolioBetas: Record<Case, number> = {
  singleCash: 0.4,
  singleNoCash: 0.48,
  highCash: 0.6,
  highNoCash: 0.96,
  low: 0.6,
  risk: 0.6,
  sector: 0.7,
  beta: 0.9,
  noVariation: 0,
  negativeBeta: -0.4,
};

function scenario(kind: Case): MeasuredHomeInsight {
  if (kind === "beta" || kind === "noVariation")
    return diversifiedScenario(kind);
  const single = ["singleCash", "singleNoCash", "negativeBeta"].includes(kind);
  const noCash = ["singleNoCash", "highNoCash"].includes(kind);
  const cash = kind === "sector" ? 0.2 : noCash ? 0.04 : single ? 0.2 : 0.4;
  const holdings: InsightHolding[] = ["BBCA", "TLKM"]
    .slice(0, single ? 1 : 2)
    .map((code, index) => ({
      code,
      beta: beta(kind === "negativeBeta" ? -0.5 : index === 0 ? 0.5 : 1.5),
      weight: portfolioWeight(
        kind === "sector"
          ? index === 0
            ? 0.5
            : 0.3
          : single
            ? 1 - cash
            : (1 - cash) / 2,
      ),
      result: cumulativeReturn(positiveHolding(kind, index) ? 0.1 : -0.1),
      varianceShare: varianceShare(
        single
          ? 1
          : index === 0
            ? kind === "sector"
              ? 0.6
              : 0.4
            : kind === "sector"
              ? 0.4
              : 0.6,
      ),
    }));
  // These undated model inputs keep weights, variance shares, and beta consistent. By hand, 30% * 0.5 + 30% * 1.5 = 0.6, and 40% + 60% = all of the variance. The observation does not estimate those measures again.
  return {
    kind: "measured",
    beta: beta(portfolioBetas[kind]),
    cashWeight: portfolioWeight(cash),
    holdings,
  };
}

function diversifiedScenario(
  kind: "beta" | "noVariation",
): MeasuredHomeInsight {
  const betas = kind === "beta" ? [0.5, 1.5, 1] : [-0.5, 0.5, 0];
  return {
    kind: "measured",
    beta: beta(portfolioBetas[kind]),
    cashWeight: portfolioWeight(0.1),
    holdings: ["BBCA", "TLKM", "AMMN"].map((code, index) => ({
      code,
      beta: beta(betas[index] ?? 0),
      weight: portfolioWeight(0.3),
      result: cumulativeReturn(-0.1),
      varianceShare:
        kind === "noVariation"
          ? undefined
          : varianceShare(index === 2 ? 0.34 : 0.33),
    })),
  };
}

for (const locale of locales) {
  test(`applies the separate cash and holding thresholds at their boundaries in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const single = scenario("singleCash");
    for (const cashWeight of [0.05, 0.0499]) {
      const portfolio = {
        ...single,
        beta: beta((1 - cashWeight) * 0.5),
        cashWeight: portfolioWeight(cashWeight),
        holdings: single.holdings.map((holding) => ({
          ...holding,
          weight: portfolioWeight(1 - cashWeight),
        })),
      };
      expect(homeInsight(portfolio).text).toBe(
        cashWeight === 0.05 ? boundaryCash[locale] : texts[locale].singleNoCash,
      );
    }
    const risk = scenario("risk");
    for (const weight of [0.05, 0.0499]) {
      const portfolio = {
        ...risk,
        beta: beta((1 - weight) * 0.5 + weight * 1.5),
        cashWeight: portfolioWeight(0),
        holdings: risk.holdings.map((holding, index) => ({
          ...holding,
          weight: portfolioWeight(index === 0 ? 1 - weight : weight),
        })),
      };
      expect(homeInsight(portfolio).topic).toBe(
        topics[locale][weight === 0.05 ? 1 : 2],
      );
    }
  });
  test(`chooses every insight and cash clause in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const studentName of [undefined, "Raka"]) {
      const expected =
        studentName === undefined ? texts[locale] : studentTexts[locale];
      for (const kind of cases)
        expect(homeInsight(scenario(kind), studentName).text, kind).toBe(
          expected[kind],
        );
      for (const kind of ["empty", "unmeasured"] as const)
        expect(homeInsight({ kind }, studentName).text).toBe(expected[kind]);
    }
    expect(homeInsight(scenario("risk")).topic).toBe(topics[locale][1]);
    expect(
      homeInsight(homeInsightData(homePortfolioForTest(cashValuationForTest())))
        .topic,
    ).toBe(topics[locale][0]);
    expect(
      homeInsight(homeInsightData(homePortfolioForTest(cashValuationForTest())))
        .text,
    ).toBe(texts[locale].empty);
    expect(
      homeInsight(homeInsightData(homePortfolioForTest(aadiValuationForTest())))
        .text,
    ).toBe(texts[locale].unmeasured);
  });
}

function positiveHolding(kind: Case, index: number): boolean {
  return ["highCash", "highNoCash"].includes(kind)
    ? index === 1
    : kind === "low" && index === 0;
}
