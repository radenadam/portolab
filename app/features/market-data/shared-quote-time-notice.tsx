import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";

export function SharedQuoteTimeNotice({
  time,
  className,
}: {
  time: string;
  className?: string | undefined;
}): ReactNode {
  return (
    <p className={className}>
      <NumberText>{m.market_data_prices_time_notice({ time })}</NumberText>
    </p>
  );
}
