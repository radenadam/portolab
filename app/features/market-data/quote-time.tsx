import type { ReactNode } from "react";
import { formatMarketTime, formatMarketTimeParts } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";

/** One Intl format keeps the date and clock consistent when the layout wraps them. */
export function QuoteTime({
  quotedAt,
  sharedTime,
}: {
  quotedAt: Date;
  sharedTime?: string | undefined;
}): ReactNode {
  if (formatMarketTime(quotedAt) === sharedTime) return null;
  const { date, clock } = formatMarketTimeParts(quotedAt);
  return (
    <time dateTime={quotedAt.toISOString()}>
      <span>
        <NumberText whole>{date}</NumberText>
      </span>
      <span>
        <NumberText whole>
          {m.market_data_quote_time_label({ time: clock })}
        </NumberText>
      </span>
    </time>
  );
}
