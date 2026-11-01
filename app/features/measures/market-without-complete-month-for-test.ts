import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import type { DailyHistory } from "~/features/market-data/price-source.server";

/** The closes of the IHSG on two days of October 2026, the only month of the history, which no close of a later month completes. */
export function marketWithoutCompleteMonthForTest(): DailyHistory {
  return buildDailyHistory({ kind: "index", code: "IHSG" }, [
    ["2026-10-29", 5098.06],
    ["2026-10-30", 5057.05],
  ]);
}
