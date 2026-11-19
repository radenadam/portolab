import type { ReactNode } from "react";
import { formatMarketTimeParts } from "./formatting";
import { m } from "./paraglide/messages.js";
import { NumberText } from "./number-text";

/** A moment in WIB, such as 19 Nov 2026, 16.14 WIB, which stays on one line with its time, as the section Interface text of AGENTS.md sets. One Intl format supplies the date and the time of day. */
export function MarketTime({ moment }: { moment: Date }): ReactNode {
  const parts = formatMarketTimeParts(moment);
  return (
    <time dateTime={moment.toISOString()}>
      <NumberText whole>
        {parts.date}
        {m.app_market_clock_part({ clock: parts.clock })}
      </NumberText>
    </time>
  );
}
