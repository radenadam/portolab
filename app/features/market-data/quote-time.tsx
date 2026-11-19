import type { ReactNode } from "react";
import { formatCalendarDate } from "~/formatting";
import { NumberText } from "~/number-text";
import { wibDateOf } from "~/wib";
import { ownQuoteTime } from "./shared-quote-time";
import styles from "./quote-time.module.css";

/** The time beside a price, on one line, as ownQuoteTime chooses it. A column too narrow for a date with its time shows a price of another day with its day alone, and the page of the stock, which the row opens, shows its time. */
export function QuoteTime({
  quotedAt,
  sharedTime,
  dayAlone = false,
  below = false,
}: {
  quotedAt: Date;
  sharedTime: Date | undefined;
  dayAlone?: boolean;
  /** Whether the time stands on a line of its own under its value, as in a cell of a table, instead of after it on its line. */
  below?: boolean;
}): ReactNode {
  const text = ownQuoteTime(quotedAt, sharedTime);
  if (text === undefined) return null;
  const isOtherDay =
    sharedTime === undefined || wibDateOf(quotedAt) !== wibDateOf(sharedTime);
  return (
    <time
      dateTime={quotedAt.toISOString()}
      className={below ? styles["below"] : styles["time"]}
    >
      <NumberText whole>
        {dayAlone && isOtherDay
          ? formatCalendarDate(wibDateOf(quotedAt), "medium")
          : text}
      </NumberText>
    </time>
  );
}
