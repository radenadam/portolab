// A nonzero formula input must not look like a zero denominator after rounding.
export function formatNonzeroNumber(
  value: number,
  formatter: Intl.NumberFormat,
): string {
  const text = formatter.format(value);
  if (value === 0 || formatter.format(Math.abs(value)) !== formatter.format(0))
    return text;
  const options = formatter.resolvedOptions();
  return new Intl.NumberFormat(options.locale, {
    ...options,
    maximumSignificantDigits: 4,
  }).format(value);
}
