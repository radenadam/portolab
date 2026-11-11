import type { Quote } from "./price-source.server";

/** When the newest of the quotes was quoted, or undefined when there is none. */
export function latestQuoteTime(
  quotes: readonly Pick<Quote, "quotedAt">[],
): Date | undefined {
  let latest: Date | undefined;
  for (const quote of quotes) {
    if (latest === undefined || quote.quotedAt > latest) {
      latest = quote.quotedAt;
    }
  }
  return latest;
}
