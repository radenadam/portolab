import YahooFinance from "yahoo-finance2";
import { errorMessage } from "~/error-message";
import { describeValue, isRecord } from "~/value-shapes";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { isIndexPoints } from "~/units/index-points";
import { isRupiah } from "~/units/rupiah";
import { startOfWibDate } from "~/wib";
import { parseYahooChart } from "./parse-yahoo-chart.server";
import type {
  IndexCode,
  Instrument,
  PriceSource,
  PriceSourceDescription,
  Quote,
  QuoteBatch,
} from "./price-source.server";

/** Yahoo Finance as a source of prices. Decision 0001 records its delay. */
export const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

const yahooIndexSymbols: Record<IndexCode, string> = {
  IHSG: "^JKSE",
};

export function createYahooPriceSource(): PriceSource {
  const client = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  return {
    ...yahooFinance,
    async fetchQuotes(instruments, signal) {
      try {
        const quotes = await client.quote(
          instruments.map(yahooSymbol),
          {
            fields: [
              "symbol",
              "currency",
              "regularMarketPrice",
              "regularMarketPreviousClose",
              "regularMarketTime",
            ],
            return: "array",
          },
          // The client passes these options to every request that it makes for this call, so the signal ends all of them.
          { fetchOptions: { signal } },
        );
        return succeed(collectYahooQuotes(instruments, quotes));
      } catch (error) {
        return fail(
          `Yahoo Finance did not answer with quotes that its client could read. The client reported: ${errorMessage(error)}`,
        );
      }
    },
    async fetchDailyHistory(instrument, from, signal) {
      try {
        const chart = await client.chart(
          yahooSymbol(instrument),
          { period1: startOfWibDate(from), interval: "1d", return: "array" },
          { fetchOptions: { signal } },
        );
        return parseYahooChart(
          chart,
          `The Yahoo Finance history of ${instrument.code}`,
          instrument,
        );
      } catch (error) {
        return fail(
          `Yahoo Finance did not answer with a history of ${instrument.code} that its client could read. The client reported: ${errorMessage(error)}`,
        );
      }
    },
  };
}

/**
 * Matches the quotes that Yahoo Finance returned to the instruments, with one problem for each instrument whose quote is missing or unusable.
 * @internal Tests call it directly, because createYahooPriceSource reaches it only through the network.
 */
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
  switch (instrument.kind) {
    case "index":
      if (
        !isIndexPoints(regularMarketPrice) ||
        !isIndexPoints(regularMarketPreviousClose)
      ) {
        return fail(
          `${source} must have finite levels, but its level is ${describeValue(regularMarketPrice)} and its previous level is ${describeValue(regularMarketPreviousClose)}.`,
        );
      }
      return succeed({
        kind: "index",
        code: instrument.code,
        level: regularMarketPrice,
        previousLevel: regularMarketPreviousClose,
        quotedAt,
      });
    case "stock":
      if (
        !isRupiah(regularMarketPrice) ||
        !isRupiah(regularMarketPreviousClose)
      ) {
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
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

function yahooSymbol(instrument: Instrument): string {
  switch (instrument.kind) {
    case "index":
      return yahooIndexSymbols[instrument.code];
    case "stock":
      return `${instrument.code}.JK`;
  }
}
