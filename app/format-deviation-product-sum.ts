import { varianceDigits } from "./formatting.ts";
import { numberFormat } from "./intl-formats.ts";
import { intlLocale } from "./intl-locale.ts";
import type { DeviationProductSum } from "./units/return-sums.ts";

/** A sum of products of deviations, such as the sum of the squared deviations of a variance, which a formula shows with the precision of a variance. */
export function formatDeviationProductSum(sum: DeviationProductSum): string {
  return numberFormat(intlLocale(), varianceDigits).format(sum);
}
