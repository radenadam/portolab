import { addDays, startOfMonth, startOfUtcDate } from "~/calendar-dates";
import { pricesFinalAt } from "~/features/market-data/idx-calendar";
import type { DailyClose } from "~/features/market-data/price-source.server";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { wibDateOf } from "~/wib";
import { homeSparklineMonths } from "./home-sparkline-months";

/** Only final closes can stand for a past day, and clamping keeps a month-end start within the preceding month. */
export function homeSparklineCloses(
  closes: readonly DailyClose<SplitAdjustedRupiah>[],
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): DailyClose<SplitAdjustedRupiah>[] {
  const today = wibDateOf(now);
  const previousMonth = startOfMonth(today, -homeSparklineMonths);
  const lastDay = startOfUtcDate(
    addDays(startOfMonth(today, 0), -1),
  ).getUTCDate();
  const from = addDays(
    previousMonth,
    Math.min(startOfUtcDate(today).getUTCDate(), lastDay) - 1,
  );
  return closes.filter(({ date }) => {
    const final = pricesFinalAt(date, delayMinutes);
    return date >= from && final.ok && final.value <= now;
  });
}
