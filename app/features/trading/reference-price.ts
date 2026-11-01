import type { StockQuote } from "~/features/market-data/price-source.server";
import type { InstrumentCloses } from "~/features/measures/aligned-returns";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import type { OrderFailure } from "./order";

/**
 * The reference price of the auto rejection limits of a trading day, which is the latest close of the stock before that day, as IDX sets it. It comes from one of two sources that are final for that day: the stored close of the trading day before, or the previous close that a quote of the trading day itself states.
 * It fails while neither exists. That lasts until the next update of the price history stores the close of a stock that traded on the trading day before, or until a stock that did not trade then, such as a suspended one, trades again during a session.
 */
export function referencePrice(
  code: string,
  sources: { quote: StockQuote; closes: InstrumentCloses },
  day: { date: string; previousDate: string },
): Result<Rupiah, OrderFailure> {
  const stored = sources.closes.closes.find(
    (close) => close.date === day.previousDate,
  );
  if (stored !== undefined) {
    // A close that a later split adjusted can hold a fraction of a rupiah, but a reference price is whole.
    return succeed(rupiah(Math.round(stored.close)));
  }
  if (wibDateOf(sources.quote.quotedAt) === day.date) {
    return succeed(sources.quote.previousClose);
  }
  return fail({ kind: "noReferenceClose", code, date: day.previousDate });
}
