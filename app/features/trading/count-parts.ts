import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";
import type { Lots } from "~/units/lots";

/** A number of lots with its noun in the active language, such as "1 lot" or "50,000 lots". */
export function lotCount(count: Lots): string {
  return countedText(
    count,
    {
      one: m.trading_one_lot_part,
      several: m.trading_several_lots_part,
    },
    {},
  );
}

/** A number of monthly returns with its noun in the active language, such as "1 monthly return" or "24 monthly returns". */
export function monthlyReturnCount(count: number): string {
  return countedText(
    count,
    {
      one: m.trading_one_monthly_return_part,
      several: m.trading_several_monthly_returns_part,
    },
    {},
  );
}
