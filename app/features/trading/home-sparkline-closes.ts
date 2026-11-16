import { addDays, startOfMonth, startOfUtcDate } from "~/calendar-dates";
import { pricesFinalAt } from "~/features/market-data/idx-calendar";
import type {
  DailyClose,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { wibDateOf } from "~/wib";
import { homeSparklineMonths } from "./home-sparkline-months";

/** Final closes preserve past days, while the quote keeps the endpoint consistent with the price beside it. */
export function homeSparklineCloses(
  closes: readonly DailyClose<SplitAdjustedRupiah>[],
  {
    now,
    delayMinutes,
    quote,
  }: { now: Date; delayMinutes: number; quote: StockQuote | undefined },
): SplitAdjustedRupiah[] {
  const today = wibDateOf(quote?.quotedAt ?? now);
  const previousMonth = startOfMonth(today, -homeSparklineMonths);
  const lastDay = startOfUtcDate(
    addDays(startOfMonth(today, 0), -1),
  ).getUTCDate();
  const from = addDays(
    previousMonth,
    Math.min(startOfUtcDate(today).getUTCDate(), lastDay) - 1,
  );
  const prices = closes
    .filter(({ date }) => {
      const final = pricesFinalAt(date, delayMinutes);
      return (
        date >= from &&
        final.ok &&
        final.value <= now &&
        (quote === undefined || date < today)
      );
    })
    .map(({ close }) => close);
  if (quote !== undefined) prices.push(splitAdjustedRupiah(quote.price));
  return prices;
}
