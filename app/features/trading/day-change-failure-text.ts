import { countedText } from "~/counted-text";
import { formatCalendarDate, formatList, formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { PortfolioDayChangeFailure } from "./read-portfolio-day-change.server";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";

/** The value already explains an unpriced holding, so the daily comparison only adds reasons of its own. */
export function dayChangeFailureText(
  failure: PortfolioDayChangeFailure,
  reader: PortfolioReader,
): string | undefined {
  switch (failure.kind) {
    case "unpriced":
      return undefined;
    case "missingCalendar":
      return textForReader(reader, {
        owner: m.trading_home_daily_calendar_notice,
        lecturer: m.trading_home_lecturer_daily_calendar_notice,
      });
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
    case "nonPositiveReference": {
      const values = {
        date: formatCalendarDate(failure.date),
        value: formatRupiah(failure.value),
      };
      return textForReader(reader, {
        owner: () => m.trading_home_daily_reference_notice(values),
        lecturer: () => m.trading_home_lecturer_daily_reference_notice(values),
      });
    }
  }
}
