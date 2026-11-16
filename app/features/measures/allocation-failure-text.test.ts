import { expect, test } from "vitest";
import { riskMeasureFailureText } from "./measure-failure-text";
import { beta } from "~/units/beta";
import { locales, type Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { languageNames } from "~/language-names";

const texts: Record<
  Locale,
  { variation: string; zero: string; negative: string }
> = {
  id: {
    variation:
      "Bobot ini memberi imbal hasil portofolio yang sama setiap bulan, sehingga varians dan simpangan bakunya nol. Ukuran yang membagi dengan keduanya tidak memiliki nilai. Ubah bobot saham di atas untuk membandingkan imbal hasil harapan dan risiko.",
    zero: "Rasio Treynor memerlukan beta di atas nol, tetapi bobot ini memberi beta 0,00. Pembagian dengan nol tidak memiliki nilai. Beta di bawah nol membuat imbal hasil di bawah tingkat bebas risiko tampak sebagai imbalan atas risiko. Ubah bobot saham di atas untuk membandingkan beta dan imbal hasil harapan.",
    negative:
      "Rasio Treynor memerlukan beta di atas nol, tetapi bobot ini memberi beta -0,52. Pembagian dengan nol tidak memiliki nilai. Beta di bawah nol membuat imbal hasil di bawah tingkat bebas risiko tampak sebagai imbalan atas risiko. Ubah bobot saham di atas untuk membandingkan beta dan imbal hasil harapan.",
  },
  en: {
    variation:
      "The weights give the same portfolio return in every month, so variance and standard deviation are zero. Measures that divide by them have no value. Change a stock weight above to compare expected return and risk.",
    zero: "The Treynor ratio needs beta above zero, but the weights give beta 0.00. Division by zero has no value. A beta below zero would make a negative excess return look like a reward for risk. Change a stock weight above to compare beta and expected return.",
    negative:
      "The Treynor ratio needs beta above zero, but the weights give beta -0.52. Division by zero has no value. A beta below zero would make a negative excess return look like a reward for risk. Change a stock weight above to compare beta and expected return.",
  },
};

for (const locale of locales) {
  test(`offers a slider step for undefined hypothetical ratios in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      riskMeasureFailureText({ kind: "noPortfolioVariation" }, "allocation"),
    ).toBe(texts[locale].variation);
    for (const [value, expected] of [
      [0, texts[locale].zero],
      [-0.5248837, texts[locale].negative],
    ] as const)
      expect(
        riskMeasureFailureText(
          { kind: "betaNotPositive", beta: beta(value) },
          "allocation",
        ),
      ).toBe(expected);
  });
}
