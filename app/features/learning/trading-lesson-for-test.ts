import { successValueForTest } from "~/success-value-for-test";
import { orderTradingDay } from "~/features/trading/order-trading-day";
import { acceptedPriceRange } from "~/features/trading/accepted-prices";
import { tradingHoursOn } from "~/features/market-data/idx-calendar";
import { stockQuote } from "~/features/market-data/stock-quote";
import { succeed } from "~/result";
import type { TradingLessonData } from "./trading-lesson-data";

export function tradingLessonForTest(date = "2026-11-02"): TradingLessonData {
  const day = orderTradingDay(new Date(`${date}T03:00:00Z`), 10);
  const tradingDay = successValueForTest(day, "Lesson trading day");
  const quote = stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55.000Z");
  return {
    date: tradingDay.date,
    code: quote.code,
    quote,
    quoteNotice: undefined,
    day,
    range: succeed(acceptedPriceRange(quote.price, tradingDay.rules)),
    hours: tradingHoursOn(tradingDay.date),
    source: { name: "Recorded source", delayMinutes: 10 },
    last: undefined,
    portfolioKind: "membership",
  };
}
