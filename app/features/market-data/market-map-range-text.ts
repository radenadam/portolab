import { monthsPerYear } from "~/time-units";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { priceChartMonths } from "./price-chart-range";
import type { MarketRange } from "./market-filters";

export function marketMapRangeText(range: MarketRange): string {
  switch (range) {
    case "1m":
    case "3m": {
      const months = priceChartMonths[range];
      return months === 1
        ? m.market_data_one_month_part({ count: formatNumber(months) })
        : m.market_data_several_months_part({ count: formatNumber(months) });
    }
    case "1y":
      return m.market_data_map_year_part({
        count: formatNumber(priceChartMonths[range] / monthsPerYear),
      });
  }
}
