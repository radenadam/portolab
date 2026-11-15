export function decimalPlaceOptions(
  decimals: number,
  signDisplay: "auto" | "negative" = "negative",
): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay,
  };
}
