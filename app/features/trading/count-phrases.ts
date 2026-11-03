import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { singularOrPlural } from "~/sentences";
import type { Lots } from "~/units/lots";

type CountMessage = (inputs: { count: string }) => string;

// A count has one form for 1 and another for several, because English changes its grammar between them.
function countPhrase(
  count: number,
  messages: { one: CountMessage; several: CountMessage },
): string {
  const message = singularOrPlural(count, messages.one, messages.several);
  return message({ count: formatNumber(count) });
}

/** A number of lots with its noun in the active language, such as "1 lot" or "50,000 lots". */
export function lotCount(count: Lots): string {
  return countPhrase(count, {
    one: m.trading_one_lot_phrase,
    several: m.trading_several_lots_phrase,
  });
}

/** A number of monthly returns with its noun in the active language, such as "1 monthly return" or "24 monthly returns". */
export function monthlyReturnCount(count: number): string {
  return countPhrase(count, {
    one: m.trading_one_monthly_return_phrase,
    several: m.trading_several_monthly_returns_phrase,
  });
}
