import type { ReactNode } from "react";
import { formatMarketTime } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";

export function SharedQuoteTimeNotice({
  moment,
  className,
}: {
  moment: Date;
  className?: string | undefined;
}): ReactNode {
  return (
    <p className={className}>
      <NumberText>
        {m.market_data_prices_time_notice({ time: formatMarketTime(moment) })}
      </NumberText>
    </p>
  );
}
