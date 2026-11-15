import type { ReactNode } from "react";
import { formatMarketTimeParts } from "./formatting";
import { m } from "./paraglide/messages.js";
import styles from "./market-time.module.css";

/** One Intl format supplies both parts, while the clock keeps its unit on narrow rows. */
export function MarketTime({ moment }: { moment: Date }): ReactNode {
  const parts = formatMarketTimeParts(moment);
  return (
    <time dateTime={moment.toISOString()}>
      {parts.date}
      <span className={styles["clock"]}>
        {m.app_market_clock_part({ clock: parts.clock })}
      </span>
    </time>
  );
}
