import { buildDailyHistory } from "./build-daily-history";
import type {
  DailyHistory,
  IndexHistory,
  StockHistory,
} from "./price-source.server";

/** The history of a stock that a test built, which fails the test when the history is of an index. */
export function stockHistoryForTest(history: DailyHistory): StockHistory {
  switch (history.kind) {
    case "stock":
      return history;
    case "index":
      throw new Error(
        `The test expects a stock, but ${history.code} is an index.`,
      );
  }
}

/** The history of an index that a test built, which fails the test when the history is of a stock. */
export function indexHistoryForTest(history: DailyHistory): IndexHistory {
  switch (history.kind) {
    case "index":
      return history;
    case "stock":
      throw new Error(
        `The test expects an index, but ${history.code} is a stock.`,
      );
  }
}

/** The history of a stock from closes that a test holds, each a date and a close. */
export function stockClosesForTest(
  code: string,
  closes: readonly (readonly [string, number])[],
): StockHistory {
  return stockHistoryForTest(
    buildDailyHistory({ kind: "stock", code }, closes),
  );
}

/** The closes of a history as the dates and closes that buildDailyHistory takes. */
export function datedClosesForTest(history: DailyHistory): [string, number][] {
  const closes: [string, number][] = [];
  for (const close of history.closes) {
    closes.push([close.date, close.close]);
  }
  return closes;
}

/** A history with the closes that a later update of the price history adds to it, each a date and a close. */
export function withClosesForTest(
  history: DailyHistory,
  added: readonly (readonly [string, number])[],
): DailyHistory {
  return buildDailyHistory(history, [...datedClosesForTest(history), ...added]);
}
