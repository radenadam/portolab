import { expect, test } from "vitest";
import {
  formatFormulaBeta,
  formatFormulaPercent,
} from "./formula-input-formatting";
import { locales, type Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { languageNames } from "./language-names";
import { beta } from "./units/beta";
import { monthlyReturn } from "./units/monthly-return";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "0,00003457",
    "-0,00003457",
    "0,0002227%",
    "-0,0002227%",
    "0,00",
    "0,00%",
    "0,62",
    "4,07%",
  ],
  en: [
    "0.00003457",
    "-0.00003457",
    "0.0002227%",
    "-0.0002227%",
    "0.00",
    "0.00%",
    "0.62",
    "4.07%",
  ],
};

for (const locale of locales) {
  test(`keeps nonzero formula operands apart from zero in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // By hand, multiplying 0.000002227101 by 100 gives 0.0002227101%, which rounds to 0.0002227% at four significant digits.
    expect([
      formatFormulaBeta(beta(0.0000345678)),
      formatFormulaBeta(beta(-0.0000345678)),
      formatFormulaPercent(monthlyReturn(0.000002227101)),
      formatFormulaPercent(monthlyReturn(-0.000002227101)),
      formatFormulaBeta(beta(0)),
      formatFormulaPercent(monthlyReturn(0)),
      formatFormulaBeta(beta(0.62)),
      formatFormulaPercent(monthlyReturn(0.04065715)),
    ]).toEqual(texts[locale]);
  });
}
