import type { ReactNode } from "react";
import { formatCalendarDate, formatMarketTimeParts } from "~/formatting";
import { MarketTime } from "~/market-time";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";

interface TimePoint {
  date: string;
  measuredAt?: Date;
}

/** The existing time component keeps the clock and its unit together in narrow chart tables. */
export function TimePointLabel({ point }: { point: TimePoint }): ReactNode {
  return point.measuredAt === undefined ? (
    <NumberText>{timePointLabel(point)}</NumberText>
  ) : (
    <MarketTime moment={point.measuredAt} />
  );
}

export function timePointLabel(point: TimePoint): string {
  if (point.measuredAt === undefined)
    return formatCalendarDate(point.date, "medium");
  const parts = formatMarketTimeParts(point.measuredAt);
  return `${parts.date}${m.app_market_clock_part({ clock: parts.clock })}`;
}
