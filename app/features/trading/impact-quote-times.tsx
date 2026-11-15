import type { ReactNode } from "react";
import { formatList, formatMarketTime } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { TradePortfolio } from "./preview-trade";
import styles from "./trade-impact.module.css";

/** The ticket's time covers matching quotes, while the phone sheet hides the stock page's provenance link. */
export function ImpactQuoteTimes({
  stocks,
  quotedAt,
}: {
  stocks: TradePortfolio["stocks"];
  quotedAt: Date;
}): ReactNode {
  const shared = formatMarketTime(quotedAt);
  const different = new Map<string, string[]>();
  for (const stock of stocks) {
    if (stock.shares === 0) continue;
    const time = formatMarketTime(stock.quotedAt);
    if (time === shared) continue;
    const codes = different.get(time) ?? [];
    codes.push(stock.code);
    different.set(time, codes);
  }
  if (different.size === 0) return null;
  return (
    <ul className={styles["quoteTimes"]}>
      {[...different].map(([time, codes]) => (
        <li key={time}>
          {m.trading_impact_price_time_label({
            codes: formatList(codes, "conjunction"),
          })}{" "}
          <NumberText whole>
            {m.trading_ticket_quote_notice({ time })}
          </NumberText>
        </li>
      ))}
    </ul>
  );
}
