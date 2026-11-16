import { numberFormat } from "./intl-formats.ts";
import { intlLocale } from "./intl-locale.ts";

// A nonzero formula input must not look like a zero denominator after rounding.
export function formatNonzeroNumber(
  value: number,
  options: Intl.NumberFormatOptions,
): string {
  const locale = intlLocale();
  const format = numberFormat(locale, options);
  const text = format.format(value);
  if (value === 0 || format.format(Math.abs(value)) !== format.format(0))
    return text;
  return numberFormat(locale, {
    ...options,
    maximumSignificantDigits: 4,
  }).format(value);
}
