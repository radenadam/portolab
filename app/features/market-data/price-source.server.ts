import type { Result } from "~/result";
import type { IndexPoints } from "~/units/index-points";
import type { Rupiah } from "~/units/rupiah";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";

/** The indices that Portolab tracks, by the code that IDX uses. */
export type IndexCode = "IHSG";

interface StockInstrument {
  kind: "stock";
  /** The code that IDX uses, such as BBCA. */
  code: string;
}

interface IndexInstrument {
  kind: "index";
  code: IndexCode;
}

export type Instrument = StockInstrument | IndexInstrument;

export interface StockQuote {
  kind: "stock";
  code: string;
  price: Rupiah;
  previousClose: Rupiah;
  quotedAt: Date;
}

/** Index levels are points with two decimals, not amounts of money. */
interface IndexQuote {
  kind: "index";
  code: IndexCode;
  level: IndexPoints;
  previousLevel: IndexPoints;
  quotedAt: Date;
}

export type Quote = StockQuote | IndexQuote;

export interface QuoteBatch {
  quotes: Quote[];
  /** One sentence for each instrument whose quote was missing or unusable. */
  problems: string[];
}

/** The close of one trading day, on its date in WIB, such as 2026-10-30. */
export interface DailyClose<Price> {
  date: string;
  close: Price;
}

/** A close of a stock, adjusted for its later splits, or of an index. */
export type ClosePrice = SplitAdjustedRupiah | IndexPoints;

/** The daily closes of one instrument, oldest first. A stock's closes are adjusted for its later splits, so a split never shows as a fall in price, and an index's closes are its levels. */
export type DailyHistory =
  | { kind: "stock"; code: string; closes: DailyClose<SplitAdjustedRupiah>[] }
  | { kind: "index"; code: IndexCode; closes: DailyClose<IndexPoints>[] };

/** What the prices page tells about the source of its prices. */
export interface PriceSourceDescription {
  /** The name of the source, such as Yahoo Finance. */
  name: string;
  /** How many minutes the prices of the source lag behind the exchange. */
  delayMinutes: number;
}

/** Every price in Portolab comes through this interface, so a licensed source can replace another without changes elsewhere. */
export interface PriceSource extends PriceSourceDescription {
  /** Fetches the latest quotes, and gives up with a failure when the signal aborts, because the job that asks sets how long it waits. */
  fetchQuotes(
    instruments: readonly Instrument[],
    signal: AbortSignal,
  ): Promise<Result<QuoteBatch, string>>;
  /** Fetches the closes of one instrument from a date in WIB, such as 2021-10-01, to the latest trading day. It gives up with a failure when the signal aborts. */
  fetchDailyHistory(
    instrument: Instrument,
    from: string,
    signal: AbortSignal,
  ): Promise<Result<DailyHistory, string>>;
}
