import type { ReactNode } from "react";
import { formatList } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { ownQuoteTime } from "./shared-quote-time";
import styles from "./quote-time.module.css";

/** The times of the prices behind a value of several prices, such as the weight of a holding, that differ from the time that a screen states once, with the codes of each time in one note, which stands beside that value in the look of the time of a price. */
export function OtherQuoteTimes({
  quotes,
  sharedTime,
}: {
  quotes: readonly { code: string; quotedAt: Date }[];
  sharedTime: Date | undefined;
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
    <span className={styles["times"]}>
      {[...different].map(([time, codes]) => (
        <span key={time} className={styles["time"]}>
          <NumberText>
            {(textValue) =>
              m.market_data_codes_price_time_notice({
                codes: textValue(formatList(codes, "conjunction")),
                time: textValue(<NumberText whole>{time}</NumberText>),
              })
            }
          </NumberText>
        </span>
      ))}
    </span>
  );
}
