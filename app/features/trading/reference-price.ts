import type {
  StockHistory,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import type { OrderFailure } from "./order";

/**
 * The reference price of the auto rejection limits of a trading day, which IDX sets from the latest close of the stock before that day. It comes from one of two sources that are final for that day. During the trading day it is the previous close that a quote of that day states, which the source adjusts for a split that takes effect that day. Before the first quote of the day it is the stored close of the trading day before, which the source adjusts for such a split only later, as issue #39 tracks.
 * It fails while neither exists. For a stock that traded on the trading day before, that ends when an update of the price history stores its close or when a quote of the trading day arrives. For a stock that did not trade then, such as a suspended one, it ends when a quote of the trading day arrives.
 */
export function referencePrice(
  code: string,
  sources: { quote: StockQuote; closes: StockHistory },
  day: { date: string; previousDate: string },
): Result<Rupiah, OrderFailure> {
  if (wibDateOf(sources.quote.quotedAt) === day.date) {
    return succeed(sources.quote.previousClose);
  }
  const stored = sources.closes.closes.find(
    (close) => close.date === day.previousDate,
  );
  if (stored !== undefined) {
    // A close that a later split adjusted can hold a fraction of a rupiah, but a reference price is whole.
    return succeed(rupiah(Math.round(stored.close)));
  }
  return fail({ kind: "noReferenceClose", code, date: day.previousDate });
}
