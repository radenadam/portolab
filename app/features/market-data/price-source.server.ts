import type { Result } from "~/result";
import type { Rupiah } from "~/units/rupiah";

export interface Instrument {
  kind: "stock" | "index";
  /** The code that IDX uses, such as BBCA for a stock or IHSG for the composite index. */
  code: string;
}

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
  code: string;
  level: number;
  previousLevel: number;
  quotedAt: Date;
}

export type Quote = StockQuote | IndexQuote;

export interface QuoteBatch {
  quotes: Quote[];
  /** One sentence for each instrument whose quote was missing or unusable. */
  problems: string[];
}

/** Every price in Portolab comes through this interface, so a licensed source can replace another without changes elsewhere. */
export interface PriceSource {
  fetchQuotes(
    instruments: readonly Instrument[],
  ): Promise<Result<QuoteBatch, string>>;
}
