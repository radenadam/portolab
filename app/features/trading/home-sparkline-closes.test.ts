import { expect, test } from "vitest";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { stockHistoryForTest } from "~/features/market-data/history-for-test";
import { homeSparklineCloses } from "./home-sparkline-closes";

// These invented prices isolate calendar boundaries, without claiming a recorded quote for a stock of IDX.
const closes = stockHistoryForTest(
  buildDailyHistory({ kind: "stock", code: "CALENDAR" }, [
    ["2026-02-27", 1000],
    ["2026-03-02", 1010],
    ["2026-03-30", 1020],
    ["2026-03-31", 1030],
  ]),
).closes;

test("clamps a month-end start to the last day of the previous month and excludes closes that are not final", () => {
  const moment = { now: new Date("2026-03-31T09:00:00Z"), delayMinutes: 10 };
  // A calendar month before 31 March is 28 February, so the close of 27 February is outside it. The close of 31 March is not final at 16:00 WIB.
  expect(homeSparklineCloses(closes, moment).map(({ date }) => date)).toEqual([
    "2026-03-02",
    "2026-03-30",
  ]);
  expect(
    homeSparklineCloses(closes, {
      ...moment,
      now: new Date("2026-03-31T10:00:00Z"),
    }).map(({ date }) => date),
  ).toEqual(["2026-03-02", "2026-03-30", "2026-03-31"]);
});
