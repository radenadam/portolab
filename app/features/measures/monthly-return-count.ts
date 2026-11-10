import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";

/** A number of monthly returns with its noun in the active language, such as "1 monthly return" or "24 monthly returns". */
export function monthlyReturnCount(count: number): string {
  return countedText(
    count,
    {
      one: m.measures_one_monthly_return_part,
      several: m.measures_several_monthly_returns_part,
    },
    {},
  );
}
