import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { ownQuoteTime } from "./shared-quote-time";

/** The time beside a price, on one line, as ownQuoteTime chooses it. */
export function QuoteTime({
  quotedAt,
  sharedTime,
}: {
  quotedAt: Date;
  sharedTime: Date | undefined;
}): ReactNode {
  const text = ownQuoteTime(quotedAt, sharedTime);
  if (text === undefined) return null;
  return (
    <time dateTime={quotedAt.toISOString()}>
      <NumberText whole>{text}</NumberText>
    </time>
  );
}
