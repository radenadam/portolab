import type { CumulativeReturn } from "~/units/cumulative-return";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { wibDateOf } from "~/wib";
import { priceChange } from "./price-change";
import type { ClosePrice, DailyClose } from "./price-source.server";

/** A past endpoint uses a final close, even when a newer quote has arrived. */
export function marketRangeChange<Price extends ClosePrice>(
  closes: readonly DailyClose<Price>[],
  from: string,
  quote: { value: NoInfer<Price>; quotedAt: Date } | undefined,
): CumulativeReturn | undefined {
  if (quote === undefined) return undefined;
  const base = closes.findLast((point) => point.date <= from);
  if (base === undefined || base.date >= wibDateOf(quote.quotedAt))
    return undefined;
  return cumulativeReturn(priceChange(quote.value, base.close));
}

/** Cash has no price change, so the stock weights retain their share of the whole portfolio. */
export function marketPortfolioChange(
  holdings: readonly {
    weight: PortfolioWeight;
    change: CumulativeReturn | undefined;
  }[],
): CumulativeReturn | undefined {
  let change = 0;
  for (const holding of holdings) {
    if (holding.change === undefined) return undefined;
    change += holding.weight * holding.change;
  }
  return cumulativeReturn(change);
}
