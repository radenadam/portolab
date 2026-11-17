import type { ReactNode } from "react";
import { formatCalendarDate } from "~/formatting";
import { NumberText } from "~/number-text";
import { wibDateOf } from "~/wib";
import { ownQuoteTime } from "./shared-quote-time";

/** The time beside a price, on one line, as ownQuoteTime chooses it. A column too narrow for a date with its time shows a price of another day with its day alone, and the page of the stock, which the row opens, shows its time. */
export function QuoteTime({
  quotedAt,
  sharedTime,
  dayAlone = false,
}: {
  quotedAt: Date;
  sharedTime: Date | undefined;
  dayAlone?: boolean;
}): ReactNode {
  const text = ownQuoteTime(quotedAt, sharedTime);
  if (text === undefined) return null;
  const isOtherDay =
    sharedTime === undefined || wibDateOf(quotedAt) !== wibDateOf(sharedTime);
  return (
    <time dateTime={quotedAt.toISOString()}>
      <NumberText whole>
        {dayAlone && isOtherDay
          ? formatCalendarDate(wibDateOf(quotedAt), "medium")
          : text}
      </NumberText>
    </time>
  );
}
