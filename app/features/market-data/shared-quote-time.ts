import { formatMarketTime } from "~/formatting";
import type { Quote } from "./price-source.server";

/** Quotes that the page writes as the same time share one note. Exceptions keep their own time beside the price. */
export function sharedQuoteTime(
  quotes: readonly (Pick<Quote, "quotedAt"> | undefined)[],
): string | undefined {
  const counts = new Map<string, number>();
  let shared: { time: string; count: number } | undefined;
  for (const quote of quotes) {
    if (quote === undefined) continue;
    const time = formatMarketTime(quote.quotedAt);
    const count = (counts.get(time) ?? 0) + 1;
    counts.set(time, count);
    if (count > 1 && (shared === undefined || count > shared.count))
      shared = { time, count };
  }
  return shared?.time;
}
