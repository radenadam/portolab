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
