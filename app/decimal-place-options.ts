export function decimalPlaceOptions(
  decimals: number,
): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "negative",
  };
}
