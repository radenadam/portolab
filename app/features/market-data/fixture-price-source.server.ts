import { succeed } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { PriceSource, Quote } from "./price-source.server";

// The closing quotes of 30 October 2026, as Yahoo Finance returned them on 31 October 2026. Browser tests use this source, so they never depend on the network.
const fixtureQuotes: Quote[] = [
  {
    kind: "index",
    code: "IHSG",
    level: 5057.05,
    previousLevel: 5098.06,
    quotedAt: new Date("2026-10-30T09:00:05.000Z"),
  },
  stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55.000Z"),
  stockQuote("BBRI", [2800, 2810], "2026-10-30T09:14:56.000Z"),
  stockQuote("BMRI", [3720, 3720], "2026-10-30T09:14:58.000Z"),
  stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:51.000Z"),
  stockQuote("ASII", [4800, 4690], "2026-10-30T09:14:58.000Z"),
];

export function createFixturePriceSource(): PriceSource {
  return {
    fetchQuotes(instruments) {
      const quotes = fixtureQuotes.filter((quote) =>
        instruments.some((instrument) => instrument.code === quote.code),
      );
      return Promise.resolve(succeed({ quotes, problems: [] }));
    },
  };
}

function stockQuote(
  code: string,
  [price, previousClose]: [number, number],
  quotedAt: string,
): Quote {
  return {
    kind: "stock",
    code,
    price: rupiah(price),
    previousClose: rupiah(previousClose),
    quotedAt: new Date(quotedAt),
  };
}
