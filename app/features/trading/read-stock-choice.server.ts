import type { Database } from "~/database/database.server";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { attemptForCodes } from "~/features/market-data/quote-failure-text";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import { m } from "~/paraglide/messages.js";
import { parseStockCode } from "./order-form-fields";

/** What the section for a new order shows about its stock: the form that chooses a stock, with the reason that the address chose none that Portolab trades, or the stock that the address chose with its latest delayed quote. */
export type StockChoice =
  | { kind: "choosing"; failure: string | undefined }
  | {
      kind: "chosen";
      code: string;
      /** The latest delayed quote of the stock, or undefined while Portolab has none. */
      quote: StockQuote | undefined;
      /** The latest attempt of the quote job, with only the stock among the prices that it could not update. */
      quoteAttempt: UpdateAttempt | undefined;
    };

/** Reads the stock that the address of the orders chose, as the address sends it, which is null before the student chooses one, with its latest delayed quote. */
export function readStockChoice(
  database: Database,
  value: string | null,
): StockChoice {
  if (value === null) {
    return { kind: "choosing", failure: undefined };
  }
  const code = parseStockCode(
    value,
    m.trading_stock_label(),
    trackedStockCodes,
  );
  if (!code.ok) {
    return { kind: "choosing", failure: code.failure };
  }
  return {
    kind: "chosen",
    code: code.value,
    quote: findStockQuote(database, code.value),
    quoteAttempt: attemptForCodes(readLatestUpdateAttempt(database, "quotes"), [
      code.value,
    ]),
  };
}
