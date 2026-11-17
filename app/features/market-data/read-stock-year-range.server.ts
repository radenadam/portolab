import { formatCalendarDate, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { stockRangeWeeks } from "./stock-price-range";
import type { stockPriceRange } from "./stock-price-range";

export function readStockYearRange(range: ReturnType<typeof stockPriceRange>) {
  const weeks = formatNumber(stockRangeWeeks);
  return {
    label: m.market_data_year_range_stat_label({ weeks }),
    meaning: m.market_data_year_range_body({ weeks }),
    range:
      range === undefined
        ? undefined
        : {
            low: range.low.close,
            high: range.high.close,
            latest: range.latest,
            example: m.market_data_year_range_notice({
              low: formatNumber(range.low.close),
              high: formatNumber(range.high.close),
              first: formatCalendarDate(range.first, "medium"),
              last: formatCalendarDate(range.last, "medium"),
            }),
            calculation: m.market_data_year_range_calculation_notice({
              low: formatNumber(range.low.close),
              high: formatNumber(range.high.close),
              lowDate: formatCalendarDate(range.low.date, "medium"),
              highDate: formatCalendarDate(range.high.date, "medium"),
            }),
          },
    unavailable: m.market_data_no_closes_notice(),
  };
}
