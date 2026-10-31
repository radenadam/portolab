import { expect, test } from "vitest";
import type { Instrument } from "./price-source.server";
import { parseYahooQuotes } from "./yahoo-price-source.server";

// The valid quotes are the closes of 30 October 2026, as Yahoo Finance returned them. Each rejection test changes one field.
const bbcaQuotedAt = new Date("2026-10-30T09:14:55.000Z");
const ihsgQuotedAt = new Date("2026-10-30T09:00:05.000Z");
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const ihsg: Instrument = { kind: "index", code: "IHSG" };

test("reads a stock quote in whole rupiah", () => {
  const batch = parseYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "IDR",
        regularMarketPrice: 4980,
        regularMarketPreviousClose: 4940,
        regularMarketTime: bbcaQuotedAt,
      },
    ],
  );
  expect(batch).toEqual({
    quotes: [
      {
        kind: "stock",
        code: "BBCA",
        price: 4980,
        previousClose: 4940,
        quotedAt: bbcaQuotedAt,
      },
    ],
    problems: [],
  });
});

test("reads the IHSG level from the ^JKSE symbol", () => {
  const batch = parseYahooQuotes(
    [ihsg],
    [
      {
        symbol: "^JKSE",
        currency: "IDR",
        regularMarketPrice: 5057.05,
        regularMarketPreviousClose: 5098.06,
        regularMarketTime: ihsgQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toEqual([
    {
      kind: "index",
      code: "IHSG",
      level: 5057.05,
      previousLevel: 5098.06,
      quotedAt: ihsgQuotedAt,
    },
  ]);
});

test("reports a missing quote without dropping the others", () => {
  const batch = parseYahooQuotes(
    [bbca, ihsg],
    [
      {
        symbol: "^JKSE",
        currency: "IDR",
        regularMarketPrice: 5057.05,
        regularMarketPreviousClose: 5098.06,
        regularMarketTime: ihsgQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toHaveLength(1);
  expect(batch.problems).toEqual(["Yahoo Finance returned no quote for BBCA."]);
});

test("rejects a stock price with a fraction of a rupiah", () => {
  const batch = parseYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "IDR",
        regularMarketPrice: 4980.5,
        regularMarketPreviousClose: 4940,
        regularMarketTime: bbcaQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toEqual([]);
  expect(batch.problems).toEqual([
    "The quote for BBCA has a price with a fraction of a rupiah.",
  ]);
});

test("rejects a quote in another currency", () => {
  const batch = parseYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "USD",
        regularMarketPrice: 4980,
        regularMarketPreviousClose: 4940,
        regularMarketTime: bbcaQuotedAt,
      },
    ],
  );
  expect(batch.problems).toEqual(["The quote for BBCA is in USD, not IDR."]);
});
