import type { StockQuote } from "~/features/market-data/price-source.server";
import type { InstrumentCloses } from "~/features/measures/aligned-returns";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import type { OrderFailure } from "./order";

/** What the reference price of a stock comes from: its latest delayed quote and the stored final closes of the stock and of the market. */
interface ReferenceSources {
  quote: StockQuote;
  closes: InstrumentCloses;
  marketCloses: InstrumentCloses;
}

/**
 * The reference price of the auto rejection limits of a trading day, which is the close of the last day on which the stock traded before it, as IDX sets it. Every source that it uses is final for that day: the stored close of the trading day before, the previous close that a quote of the trading day itself states, or the latest stored close of a stock that did not trade on the trading day before, such as a suspended one.
 * It fails while the stored history lacks the close of the trading day before, which the next update of the price history stores.
 */
export function referencePrice(
  code: string,
  sources: ReferenceSources,
  day: { date: string; previousDate: string },
): Result<Rupiah, OrderFailure> {
  const stored = closeOn(sources.closes, day.previousDate);
  if (stored !== undefined) {
    return succeed(wholeRupiah(stored));
  }
  const quotedOn = wibDateOf(sources.quote.quotedAt);
  if (quotedOn === day.date) {
    return succeed(sources.quote.previousClose);
  }
  // The market trades on every trading day, so its stored close of the trading day before shows that the update of the price history has reached that day. A stock whose latest quote is older did not trade on it, and its latest stored close is final once it is at least as recent as that quote.
  const latest = sources.closes.closes.at(-1);
  if (
    closeOn(sources.marketCloses, day.previousDate) !== undefined &&
    quotedOn < day.previousDate &&
    latest !== undefined &&
    latest.date >= quotedOn
  ) {
    return succeed(wholeRupiah(latest.close));
  }
  return fail({ kind: "noReferenceClose", code, date: day.previousDate });
}

function closeOn(history: InstrumentCloses, date: string): number | undefined {
  return history.closes.find((close) => close.date === date)?.close;
}

// A close that a later split adjusted can hold a fraction of a rupiah, but a reference price is whole.
function wholeRupiah(close: number): Rupiah {
  return rupiah(Math.round(close));
}
