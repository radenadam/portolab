import type { ReactNode } from "react";
import { formatMarketTime } from "~/formatting";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";

/** Each formatted moment keeps its clock and WIB together inside the translated sentence. */
export function TicketSchedule({
  tradesFrom,
  expiresAt,
}: {
  tradesFrom: Date;
  expiresAt: Date;
}): ReactNode {
  return (
    <Message
      text={m.trading_ticket_schedule_notice}
      values={{
        start: <NumberText whole>{formatMarketTime(tradesFrom)}</NumberText>,
        end: <NumberText whole>{formatMarketTime(expiresAt)}</NumberText>,
      }}
    />
  );
}
