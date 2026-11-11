import type { StockQuote } from "./price-source.server.ts";
import { stockQuote } from "./stock-quote.ts";

/** The closing quote of UNVR of 30 October 2026, as Yahoo Finance returned it, which the fixture source leaves out. The browser tests store it before the server starts, as an earlier update would have, so they show a price that the latest update missed. */
export const unvrCloseForTest = stockQuote(
  "UNVR",
  [1_390, 1_400],
  "2026-10-30T09:14:51.000Z",
);

/** The closing quotes of 30 October 2026, as Yahoo Finance returned them, of the stocks that the fixture source leaves out, so that a test can answer for every instrument that Portolab tracks. */
export const leftOutQuotesForTest: readonly StockQuote[] = [
  unvrCloseForTest,
  stockQuote("WIFI", [910, 935], "2026-10-30T09:14:29.000Z"),
];
