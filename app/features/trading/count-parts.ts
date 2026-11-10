import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";
import type { Lots } from "~/units/lots";
import type { Shares } from "~/units/shares";

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

/** A number of shares with its noun in the active language, such as "1 share" or "500 shares". */
export function shareCount(count: Shares): string {
  return countedText(
    count,
    {
      one: m.trading_one_share_part,
      several: m.trading_several_shares_part,
    },
    {},
  );
}
