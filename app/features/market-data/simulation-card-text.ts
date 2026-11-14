import { formatMarketTime, formatMinutes } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { latestQuoteTime } from "./latest-quote-time";
import type { PriceSourceDescription, Quote } from "./price-source.server";
import { noPricesText, quoteFailureText } from "./quote-failure-text";
import type { UpdateAttempt } from "./update-attempts.server";

/** The paragraphs of the card that the badge of the simulation opens: that every result is a simulation and where the delayed prices come from, when the latest price was quoted or why Portolab has none yet, and the prices that the latest attempt of the quote job could not update with the time of the next attempt. */
export function simulationCardText(
  quotes: readonly Quote[],
  latestAttempt: UpdateAttempt | undefined,
  { now, source }: { now: Date; source: PriceSourceDescription },
): string[] {
  const delay = { now, delayMinutes: source.delayMinutes };
  const simulation = m.market_data_simulation_body({
    source: source.name,
    delay: formatMinutes(source.delayMinutes, "long"),
  });
  const latestQuotedAt = latestQuoteTime(quotes);
  // Without a stored price, every price failed alike, which the text of a market without prices already says.
  if (latestQuotedAt === undefined) {
    return [simulation, noPricesText(latestAttempt, delay)];
  }
  const failure = quoteFailureText(latestAttempt, quotes, delay);
  return [
    simulation,
    m.market_data_latest_price_notice({
      time: formatMarketTime(latestQuotedAt),
    }),
    ...(failure === undefined ? [] : [failure]),
  ];
}
