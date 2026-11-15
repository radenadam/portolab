import type { ReactNode } from "react";
import { QuoteNotice } from "./quote-notice";
import { noPricesText, quoteFailureText } from "./quote-failure-text";
import type { PricesOfView } from "./read-prices.server";
import styles from "./market-view.module.css";

/** Failed and missing prices need distinct explanations because only the first has a stored quote. */
export function PriceStatus({
  quotes,
  latestAttempt,
  now,
  source,
}: PricesOfView): ReactNode {
  const schedule = { now, delayMinutes: source.delayMinutes };
  const text =
    quotes.length === 0
      ? noPricesText(latestAttempt, schedule)
      : quoteFailureText(latestAttempt, quotes, schedule);
  return <QuoteNotice text={text} className={styles["notice"]} />;
}
