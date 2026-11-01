import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isIndexPoints } from "~/units/index-points";
import { isSplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { describeValue, isRecord } from "~/value-shapes";
import { wibDateOf } from "~/wib";
import type {
  DailyClose,
  DailyHistory,
  Instrument,
} from "./price-source.server";

/** Reads the daily chart that Yahoo Finance returned for an instrument as its closes in WIB dates, oldest first. A row without a close, which Yahoo sends for a day without data, is skipped. */
export function parseYahooChart(
  value: unknown,
  source: string,
  instrument: Instrument,
): Result<DailyHistory, string> {
  if (!isRecord(value)) {
    return fail(
      `${source} must be an object, but it is ${describeValue(value)}.`,
    );
  }
  const meta = value["meta"];
  const currency = isRecord(meta) ? meta["currency"] : undefined;
  if (currency !== "IDR") {
    return fail(
      `${source} must be in IDR, but its currency is ${describeValue(currency)}.`,
    );
  }
  const rows = value["quotes"];
  switch (instrument.kind) {
    case "stock": {
      const closes = parseCloses(rows, source, isSplitAdjustedRupiah);
      return closes.ok
        ? succeed({
            kind: "stock",
            code: instrument.code,
            closes: closes.value,
          })
        : closes;
    }
    case "index": {
      const closes = parseCloses(rows, source, isIndexPoints);
      return closes.ok
        ? succeed({
            kind: "index",
            code: instrument.code,
            closes: closes.value,
          })
        : closes;
    }
  }
}

// Yahoo sends the values of a chart as 32-bit floats, such as 5057.0498046875 for 5057.05, so each close is rounded to the two decimals that its quotes have. A student then sees the same close that the measures use.
function parseCloses<Price extends number>(
  value: unknown,
  source: string,
  isPrice: (price: number) => price is Price,
): Result<DailyClose<Price>[], string> {
  if (!Array.isArray(value)) {
    return fail(
      `${source} must have a list of quotes, but it is ${describeValue(value)}.`,
    );
  }
  // Yahoo sometimes repeats the latest day in a second row, so a later row of a date replaces an earlier one.
  const closesByDate = new Map<string, Price>();
  for (const [index, row] of value.entries()) {
    const rowNumber = String(index + 1);
    const date = isRecord(row) ? row["date"] : undefined;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return fail(
        `${source} must have a time in the date of each row, but row ${rowNumber} has ${describeValue(date)}.`,
      );
    }
    const close = isRecord(row) ? row["close"] : undefined;
    if (close === null) {
      continue;
    }
    const roundedClose =
      typeof close === "number" ? Math.round(close * 100) / 100 : Number.NaN;
    if (!isPrice(roundedClose)) {
      return fail(
        `${source} must have a positive close or null in each row, but row ${rowNumber} has ${describeValue(close)}.`,
      );
    }
    closesByDate.set(wibDateOf(date), roundedClose);
  }
  const closes: DailyClose<Price>[] = [];
  for (const [date, close] of closesByDate) {
    closes.push({ date, close });
  }
  closes.sort((first, second) => first.date.localeCompare(second.date));
  return succeed(closes);
}
