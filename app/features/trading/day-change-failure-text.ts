import { countedText } from "~/counted-text";
import { formatCalendarDate, formatList, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { PortfolioDayChangeFailure } from "./read-portfolio-day-change.server";

/** The value already explains an unpriced holding, so the daily comparison only adds reasons of its own. */
export function dayChangeFailureText(
  failure: PortfolioDayChangeFailure,
): string | undefined {
  switch (failure.kind) {
    case "unpriced":
      return undefined;
    case "missingCalendar":
      return m.trading_home_daily_calendar_notice();
    case "missingCloses":
      return countedText(
        failure.codes.length,
        {
          one: m.trading_home_one_daily_close_notice,
          several: m.trading_home_several_daily_closes_notice,
        },
        {
          date: formatCalendarDate(failure.date),
          codes: formatList(failure.codes, "conjunction"),
        },
      );
    case "nonPositiveReference":
      return m.trading_home_daily_reference_notice({
        date: formatCalendarDate(failure.date),
        value: formatRupiah(failure.value),
      });
  }
}
