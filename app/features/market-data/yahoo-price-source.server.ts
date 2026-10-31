import YahooFinance from "yahoo-finance2";
import { fail, succeed } from "~/result";
import { isRupiah } from "~/units/rupiah";
import type {
  Instrument,
  PriceSource,
  Quote,
  QuoteBatch,
} from "./price-source.server";

const yahooIndexSymbols: Record<string, string | undefined> = {
  IHSG: "^JKSE",
};

/** A quote as Yahoo Finance returns it. Yahoo changes its responses without notice, so every field Portolab reads is parsed. */
export type YahooQuote = Readonly<Record<string, unknown>>;

export function createYahooPriceSource(): PriceSource {
  const client = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  return {
    async fetchQuotes(instruments) {
      try {
        const quotes = await client.quote(instruments.map(yahooSymbol), {
          fields: [
            "symbol",
            "currency",
            "regularMarketPrice",
            "regularMarketPreviousClose",
            "regularMarketTime",
          ],
          return: "array",
        });
        return succeed(parseYahooQuotes(instruments, quotes));
      } catch (error) {
        return fail({
          reason: "unreachable",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

export function parseYahooQuotes(
  instruments: readonly Instrument[],
  yahooQuotes: readonly YahooQuote[],
): QuoteBatch {
  const batch: QuoteBatch = { quotes: [], problems: [] };
  for (const instrument of instruments) {
    const yahooQuote = yahooQuotes.find(
      (candidate) => candidate["symbol"] === yahooSymbol(instrument),
    );
    if (yahooQuote === undefined) {
      batch.problems.push(
        `Yahoo Finance returned no quote for ${instrument.code}.`,
      );
      continue;
    }
    const quote = toQuote(instrument, yahooQuote);
    if (typeof quote === "string") {
      batch.problems.push(quote);
    } else {
      batch.quotes.push(quote);
    }
  }
  return batch;
}

/** Returns the quote, or a sentence that explains why the Yahoo quote cannot be used. */
function toQuote(
  instrument: Instrument,
  yahooQuote: YahooQuote,
): Quote | string {
  const currency = yahooQuote["currency"];
  const price = yahooQuote["regularMarketPrice"];
  const previousClose = yahooQuote["regularMarketPreviousClose"];
  const quotedAt = yahooQuote["regularMarketTime"];
  if (currency !== "IDR") {
    return `The quote for ${instrument.code} is in ${String(currency)}, not IDR.`;
  }
  if (
    typeof price !== "number" ||
    typeof previousClose !== "number" ||
    !(quotedAt instanceof Date)
  ) {
    return `The quote for ${instrument.code} lacks its price, previous close, or time.`;
  }
  if (!(price > 0) || !(previousClose > 0)) {
    return `The quote for ${instrument.code} has a price that is not positive.`;
  }
  if (instrument.kind === "index") {
    return {
      kind: "index",
      code: instrument.code,
      level: price,
      previousLevel: previousClose,
      quotedAt,
    };
  }
  if (!isRupiah(price) || !isRupiah(previousClose)) {
    return `The quote for ${instrument.code} has a price with a fraction of a rupiah.`;
  }
  return {
    kind: "stock",
    code: instrument.code,
    price,
    previousClose,
    quotedAt,
  };
}

function yahooSymbol(instrument: Instrument): string {
  if (instrument.kind === "index") {
    return yahooIndexSymbols[instrument.code] ?? instrument.code;
  }
  return `${instrument.code}.JK`;
}
