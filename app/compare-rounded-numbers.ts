import { numberPrecisionOptions } from "./formatting.ts";
import type { ChangeDirection } from "./formatting.ts";

/** Interpretations use the same Intl rounding as the text. The canonical format has no groups, so the program can read it back. */
export function compareRoundedNumbers<Value extends number>(
  first: Value,
  second: NoInfer<Value>,
  precision: keyof typeof numberPrecisionOptions,
): ChangeDirection {
  const format = new Intl.NumberFormat("en-US", {
    ...numberPrecisionOptions[precision],
    useGrouping: false,
  });
  const firstValue = Number(format.format(first));
  const secondValue = Number(format.format(second));
  if (firstValue > secondValue) return "rise";
  return firstValue < secondValue ? "fall" : "none";
}
