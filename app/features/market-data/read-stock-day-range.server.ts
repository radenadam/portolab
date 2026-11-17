import { formatMarketTime, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { StockQuote } from "./price-source.server";

export function readStockDayRange(code: string, quote: StockQuote | undefined) {
  const range = quote?.dayRange;
  const concept = {
    label: m.market_data_day_range_label(),
    meaning: m.market_data_day_range_body(),
  };
  if (range === undefined || quote === undefined) {
    return {
      ...concept,
      range: undefined,
      explanation: m.market_data_no_day_range_notice({ code }),
    };
  }
  const time = m.market_data_quote_time_label({
    time: formatMarketTime(quote.quotedAt),
  });
  return {
    ...concept,
    range: { ...range, latest: quote.price, time },
    explanation: m.market_data_day_range_notice({
      code,
      low: formatNumber(range.low),
      high: formatNumber(range.high),
      time,
    }),
  };
}
