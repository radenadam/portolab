import { expect, test } from "vitest";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { stockHistoryForTest } from "~/features/market-data/history-for-test";
import { homeSparklineCloses } from "./home-sparkline-closes";
import { stockQuote } from "~/features/market-data/stock-quote";

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
  const moment = {
    now: new Date("2026-03-31T09:00:00Z"),
    delayMinutes: 10,
    quote: undefined,
  };
  // A calendar month before 31 March is 28 February, so the close of 27 February is outside it. The close of 31 March is not final at 16:00 WIB.
  expect(homeSparklineCloses(closes, moment)).toEqual([1010, 1020]);
  expect(
    homeSparklineCloses(closes, {
      ...moment,
      now: new Date("2026-03-31T10:00:00Z"),
    }),
  ).toEqual([1010, 1020, 1030]);
});

test("ends the holding sparkline at its displayed quote and keeps only earlier final days", () => {
  // CALENDAR has invented prices to isolate the endpoint. By hand its current 990 is below the earlier minimum of 1010, so the final mark must be the bottom of its range.
  const quote = stockQuote("CALENDAR", [990, 1020], "2026-03-31T02:50:00Z");
  expect(
    homeSparklineCloses(closes, {
      now: new Date("2026-04-01T03:00:00Z"),
      delayMinutes: 10,
      quote,
    }),
  ).toEqual([1010, 1020, 990]);
});
