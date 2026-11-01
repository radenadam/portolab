import type { Result } from "~/result";
import type { IndexPoints } from "~/units/index-points";
import type { Rupiah } from "~/units/rupiah";

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

interface StockQuote {
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
}
