import type { ReactNode } from "react";
import { formatMarketTimeParts } from "~/formatting";
import { m } from "~/paraglide/messages.js";

/** One Intl format keeps the date and clock consistent when the layout wraps them. */
export function QuoteTime({ quotedAt }: { quotedAt: Date }): ReactNode {
  const { date, clock } = formatMarketTimeParts(quotedAt);
  return (
    <time dateTime={quotedAt.toISOString()}>
      <span>{date}</span>
      <span>{m.market_data_quote_time_label({ time: clock })}</span>
    </time>
  );
}
