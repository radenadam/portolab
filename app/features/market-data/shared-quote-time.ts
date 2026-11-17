import { formatMarketTime, formatMarketTimeParts } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Quote } from "./price-source.server";

/** The moment of the time that most quotes share as the page writes it, which the page states once. Of times that as many quotes share, the latest wins, so every other price shows an earlier time beside it. */
export function sharedQuoteTime(
  quotes: readonly (Pick<Quote, "quotedAt"> | undefined)[],
): Date | undefined {
  const counts = new Map<string, number>();
  let shared: { moment: Date; count: number } | undefined;
  for (const quote of quotes) {
    if (quote === undefined) continue;
    const time = formatMarketTime(quote.quotedAt);
    const count = (counts.get(time) ?? 0) + 1;
    counts.set(time, count);
    if (
      shared === undefined ||
      count > shared.count ||
      (count === shared.count && quote.quotedAt > shared.moment)
    )
      shared = { moment: quote.quotedAt, count };
  }
  return shared?.moment;
}

/** The time that a price shows beside it: none when the time that the page states once covers it, the time of day when it falls on the date of that time, and its date with the time of day otherwise, so a list of prices from one day after the close repeats no date. */
export function ownQuoteTime(
  quotedAt: Date,
  shared: Date | undefined,
): string | undefined {
  if (
    shared !== undefined &&
    formatMarketTime(quotedAt) === formatMarketTime(shared)
  )
    return undefined;
  const parts = formatMarketTimeParts(quotedAt);
  return m.market_data_quote_time_label({
    time:
      shared !== undefined && parts.date === formatMarketTimeParts(shared).date
        ? parts.clock
        : formatMarketTime(quotedAt),
  });
}
