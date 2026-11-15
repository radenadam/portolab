import { addDays, startOfMonth, startOfUtcDate } from "~/calendar-dates";
import { succeed } from "~/result";
import { checkFieldLengthForReader } from "~/form-text";
import type { Result } from "~/result";
import { parseChoice } from "~/value-parsers";
import type { FieldOption } from "~/form";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { monthsPerYear } from "~/time-units";

const priceChartRanges = ["1m", "3m", "1y", "5y"] as const;
export type PriceChartRange = (typeof priceChartRanges)[number];
export const priceChartMonths: Readonly<Record<PriceChartRange, number>> = {
  "1m": 1,
  "3m": 3,
  "1y": monthsPerYear,
  "5y": 5 * monthsPerYear,
};

export function priceChartRangeOptions(): FieldOption<PriceChartRange>[] {
  return priceChartRanges.map((value) => ({
    value,
    label:
      priceChartMonths[value] < monthsPerYear
        ? m.market_data_month_range_label({
            count: formatNumber(priceChartMonths[value]),
          })
        : m.market_data_year_range_label({
            count: formatNumber(priceChartMonths[value] / monthsPerYear),
          }),
  }));
}

export function parsePriceChartRange(
  value: unknown,
  source: string,
): Result<PriceChartRange, string> {
  if (value === null) return succeed("1y");
  if (typeof value === "string") {
    const text = checkFieldLengthForReader(value, source);
    if (!text.ok) return text;
  }
  return parseChoice(value, source, priceChartRanges);
}

/** A month may lack the starting day, so subtracting months must stay inside it. */
export function priceChartStart(date: string, range: PriceChartRange): string {
  const first = startOfMonth(date, -priceChartMonths[range]);
  const last = addDays(startOfMonth(first, 1), -1);
  const day = Math.min(
    startOfUtcDate(date).getUTCDate(),
    startOfUtcDate(last).getUTCDate(),
  );
  return addDays(first, day - 1);
}
