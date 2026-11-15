import { countedText } from "~/counted-text";
import {
  formatCalendarDate,
  formatList,
  formatMarketClock,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { HistoryEnd } from "./portfolio-history";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";

export function historyEndText(
  end: HistoryEnd,
  reader: PortfolioReader,
): string {
  switch (end.kind) {
    case "notFinal":
      return m.trading_chart_not_final_notice({
        date: formatCalendarDate(end.date),
        time: formatMarketClock(end.finalAt),
      });
    case "missingCloses":
      return countedText(
        end.codes.length,
        {
          one: m.trading_one_missing_close_notice,
          several: m.trading_several_missing_closes_notice,
        },
        {
          codes: formatList(end.codes, "conjunction"),
          date: formatCalendarDate(end.date),
        },
      );
    case "missingCalendar":
      return missingCalendarText(reader);
  }
}

/** The text that says that Portolab has not recorded the trading calendar of the next trading day, with the step of its reader. */
export function missingCalendarText(reader: PortfolioReader): string {
  return textForReader(reader, {
    owner: () => m.trading_chart_calendar_missing_notice(),
    lecturer: () => m.trading_lecturer_chart_calendar_missing_notice(),
  });
}
