import { addDays } from "~/calendar-dates";
import type { StockHistory } from "./price-source.server";

export const stockRangeWeeks = 52;
const daysInWeek = 7;

/** Only stored final closes enter the range, so an intraday quote cannot change a past range. */
export function stockPriceRange(
  history: StockHistory,
  date: string,
):
  | {
      low: StockHistory["closes"][number];
      high: StockHistory["closes"][number];
      first: string;
      last: string;
      latest: StockHistory["closes"][number]["close"];
    }
  | undefined {
  const from = addDays(date, -stockRangeWeeks * daysInWeek);
  const closes = history.closes.filter(
    (point) => point.date >= from && point.date <= date,
  );
  const first = closes[0];
  const last = closes.at(-1);
  if (first === undefined || last === undefined) return undefined;
  let low = first;
  let high = first;
  for (const point of closes) {
    if (point.close < low.close) low = point;
    if (point.close > high.close) high = point;
  }
  return { low, high, first: first.date, last: last.date, latest: last.close };
}
