import YahooFinance from "yahoo-finance2";
import { errorMessage } from "~/error-message";
import { describeValue, isRecord } from "~/value-shapes";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
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
        return succeed(collectYahooQuotes(instruments, quotes));
      } catch (error) {
        return fail(
          `Yahoo Finance did not answer with quotes that its client could read. The client reported: ${errorMessage(error)}`,
        );
      }
    },
  };
}

/** Matches the quotes that Yahoo Finance returned to the instruments, with one problem for each instrument whose quote is missing or unusable. */
export function collectYahooQuotes(
  instruments: readonly Instrument[],
  yahooQuotes: readonly unknown[],
): QuoteBatch {
  const batch: QuoteBatch = { quotes: [], problems: [] };
  for (const instrument of instruments) {
    const yahooQuote = yahooQuotes.find(
      (candidate) =>
        isRecord(candidate) && candidate["symbol"] === yahooSymbol(instrument),
    );
    const quote =
      yahooQuote === undefined
        ? fail(`Yahoo Finance returned no quote for ${instrument.code}.`)
        : parseYahooQuote(
            yahooQuote,
            `The Yahoo Finance quote for ${instrument.code}`,
            instrument,
          );
    if (quote.ok) {
      batch.quotes.push(quote.value);
    } else {
      batch.problems.push(quote.failure);
    }
  }
  return batch;
}

// Yahoo changes its responses without notice, so every field that Portolab uses is checked.
function parseYahooQuote(
  value: unknown,
  source: string,
  instrument: Instrument,
): Result<Quote, string> {
  if (!isRecord(value)) {
    return fail(
      `${source} must be an object, but it is ${describeValue(value)}.`,
    );
  }
  const { currency, regularMarketPrice, regularMarketPreviousClose } = value;
  const quotedAt = value["regularMarketTime"];
  if (currency !== "IDR") {
    return fail(
      `${source} must be in IDR, but its currency is ${describeValue(currency)}.`,
    );
  }
  if (!isPositiveNumber(regularMarketPrice)) {
    return fail(
      `${source} must have a positive regularMarketPrice, but it is ${describeValue(regularMarketPrice)}.`,
    );
  }
  if (!isPositiveNumber(regularMarketPreviousClose)) {
    return fail(
      `${source} must have a positive regularMarketPreviousClose, but it is ${describeValue(regularMarketPreviousClose)}.`,
    );
  }
  if (!(quotedAt instanceof Date)) {
    return fail(
      `${source} must have a time at regularMarketTime, but it is ${describeValue(quotedAt)}.`,
    );
  }
  if (instrument.kind === "index") {
    return succeed({
      kind: "index",
      code: instrument.code,
      level: regularMarketPrice,
      previousLevel: regularMarketPreviousClose,
      quotedAt,
    });
  }
  if (!isRupiah(regularMarketPrice) || !isRupiah(regularMarketPreviousClose)) {
    return fail(
      `${source} must have whole rupiah, but its price is ${describeValue(regularMarketPrice)} and its previous close is ${describeValue(regularMarketPreviousClose)}.`,
    );
  }
  return succeed({
    kind: "stock",
    code: instrument.code,
    price: regularMarketPrice,
    previousClose: regularMarketPreviousClose,
    quotedAt,
  });
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

function yahooSymbol(instrument: Instrument): string {
  if (instrument.kind === "index") {
    return yahooIndexSymbols[instrument.code] ?? instrument.code;
  }
  return `${instrument.code}.JK`;
}
