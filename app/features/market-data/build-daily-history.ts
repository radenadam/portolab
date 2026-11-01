import { indexPoints } from "~/units/index-points";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { DailyHistory, Instrument } from "./price-source.server";

/** Builds the daily history of an instrument from closes that the program holds, such as answers of a source that it recorded, each a date in WIB and a close. */
export function buildDailyHistory(
  instrument: Instrument,
  closes: readonly (readonly [string, number])[],
): DailyHistory {
  switch (instrument.kind) {
    case "stock":
      return {
        kind: "stock",
        code: instrument.code,
        closes: closes.map(([date, close]) => ({
          date,
          close: splitAdjustedRupiah(close),
        })),
      };
    case "index":
      return {
        kind: "index",
        code: instrument.code,
        closes: closes.map(([date, close]) => ({
          date,
          close: indexPoints(close),
        })),
      };
  }
}
