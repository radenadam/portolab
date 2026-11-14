import { formatMarketTime } from "~/formatting";
import type { ValuedHolding } from "./value-portfolio";

/** Quotes that the page writes as the same time share one note. Exceptions keep their own time beside the price. */
export function sharedQuoteTime(
  holdings: readonly ValuedHolding[],
): string | undefined {
  const counts = new Map<string, number>();
  let shared: { time: string; count: number } | undefined;
  for (const holding of holdings) {
    if (holding.kind !== "priced") continue;
    const time = formatMarketTime(holding.quote.quotedAt);
    const count = (counts.get(time) ?? 0) + 1;
    counts.set(time, count);
    if (count > 1 && (shared === undefined || count > shared.count))
      shared = { time, count };
  }
  return shared?.time;
}
