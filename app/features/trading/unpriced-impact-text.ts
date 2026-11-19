import { countedText } from "~/counted-text";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";

/** The reason that the impact of a trade cannot be shown, which names every held stock without a price. */
export function unpricedImpactText(codes: readonly string[]): string {
  return countedText(
    codes.length,
    {
      one: m.trading_impact_one_unpriced_stock_notice,
      several: m.trading_impact_several_unpriced_stocks_notice,
    },
    { codes: formatList(codes, "conjunction") },
  );
}
