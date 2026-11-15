import { formatNonzeroNumber } from "./format-nonzero-number.ts";
import { numberPrecisionOptions } from "./formatting.ts";
import { intlLocale } from "./intl-locale.ts";
import type { Beta } from "./units/beta.ts";
import type { MonthlyReturn } from "./units/monthly-return.ts";

export function formatFormulaBeta(beta: Beta): string {
  return formatNonzeroNumber(
    beta,
    new Intl.NumberFormat(intlLocale(), numberPrecisionOptions.ratio),
  );
}

export function formatFormulaPercent(fraction: MonthlyReturn): string {
  return formatNonzeroNumber(
    fraction,
    new Intl.NumberFormat(intlLocale(), {
      style: "percent",
      ...numberPrecisionOptions.ratio,
    }),
  );
}
