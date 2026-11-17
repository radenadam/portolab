import type { ReactNode } from "react";
import { formatList } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { ownQuoteTime } from "./shared-quote-time";

/** The times of the prices that differ from the time that a screen states once, such as the prices of the other holdings beside the price of a stock, with the codes of each time in one line. */
export function OtherQuoteTimes({
  quotes,
  sharedTime,
  className,
}: {
  quotes: readonly { code: string; quotedAt: Date }[];
  sharedTime: Date | undefined;
  className: string | undefined;
}): ReactNode {
  const different = new Map<string, string[]>();
  for (const quote of quotes) {
    const time = ownQuoteTime(quote.quotedAt, sharedTime);
    if (time === undefined) continue;
    const codes = different.get(time) ?? [];
    codes.push(quote.code);
    different.set(time, codes);
  }
  if (different.size === 0) return null;
  return (
    <ul className={className}>
      {[...different].map(([time, codes]) => (
        <li key={time}>
          <NumberText>
            {(textValue) =>
              m.market_data_codes_price_time_notice({
                codes: textValue(formatList(codes, "conjunction")),
                time: textValue(<NumberText whole>{time}</NumberText>),
              })
            }
          </NumberText>
        </li>
      ))}
    </ul>
  );
}
