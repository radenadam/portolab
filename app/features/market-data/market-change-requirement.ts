import { formatCalendarDate } from "~/formatting";
import { m } from "~/paraglide/messages.js";

export function marketChangeRequirement(from: string): string {
  return m.market_data_map_change_requirement_notice({
    date: formatCalendarDate(from),
  });
}
