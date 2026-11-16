import { formatNonzeroNumber } from "./format-nonzero-number.ts";
import { numberPrecisionOptions } from "./formatting.ts";
import type { Beta } from "./units/beta.ts";
import type { MonthlyReturn } from "./units/monthly-return.ts";

export function formatFormulaBeta(beta: Beta): string {
  return formatNonzeroNumber(beta, numberPrecisionOptions.ratio);
}

export function formatFormulaPercent(fraction: MonthlyReturn): string {
  return formatNonzeroNumber(fraction, {
    style: "percent",
    ...numberPrecisionOptions.ratio,
  });
}
