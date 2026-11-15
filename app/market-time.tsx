import type { ReactNode } from "react";
import { formatMarketTimeParts } from "./formatting";
import { m } from "./paraglide/messages.js";
import { NumberText } from "./number-text";

/** One Intl format supplies both parts, while the clock keeps its unit on narrow rows. */
export function MarketTime({ moment }: { moment: Date }): ReactNode {
  const parts = formatMarketTimeParts(moment);
  return (
    <time dateTime={moment.toISOString()}>
      <NumberText>{parts.date}</NumberText>
      <NumberText whole>
        {m.app_market_clock_part({ clock: parts.clock })}
      </NumberText>
    </time>
  );
}
