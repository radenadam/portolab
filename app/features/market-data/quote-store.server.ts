import { asc, eq } from "drizzle-orm";
import type {
  Database,
  DatabaseWriter,
} from "../../database/database.server.ts";
import { indexQuotes, stockQuotes } from "./market-data.schema.ts";
import type {
  IndexCode,
  IndexQuote,
  Quote,
  StockQuote,
} from "./price-source.server.ts";
import { readLatestUpdateAttempt } from "./update-attempts.server.ts";

export function saveQuotes(
  database: Database,
  quotes: readonly Quote[],
  fetchedAt: Date,
): void {
  database.transaction((transaction) => {
    for (const quote of quotes) {
      if (quote.kind === "stock") {
        const row = {
          code: quote.code,
          price: quote.price,
          previousClose: quote.previousClose,
          quotedAt: quote.quotedAt,
          fetchedAt,
        };
        transaction
          .insert(stockQuotes)
          .values(row)
          .onConflictDoUpdate({ target: stockQuotes.code, set: row })
          .run();
      } else {
        const row = {
          code: quote.code,
          level: quote.level,
          previousLevel: quote.previousLevel,
          quotedAt: quote.quotedAt,
          fetchedAt,
        };
        transaction
          .insert(indexQuotes)
          .values(row)
          .onConflictDoUpdate({ target: indexQuotes.code, set: row })
          .run();
      }
    }
  });
}

/** Lists the latest quote of every instrument, the indices first and then the stocks, each by code. */
export function listLatestQuotes(database: Database): Quote[] {
  const quotes: Quote[] = [];
  for (const row of database
    .select()
    .from(indexQuotes)
    .orderBy(asc(indexQuotes.code))
    .all()) {
    quotes.push(indexQuoteOf(row));
  }
  for (const row of database
    .select()
    .from(stockQuotes)
    .orderBy(asc(stockQuotes.code))
    .all()) {
    quotes.push(stockQuoteOf(row));
  }
  return quotes;
}

/** The latest quote of an index, or undefined while Portolab has none, such as before the first update of prices. */
export function findIndexQuote(
  database: Database,
  code: IndexCode,
): IndexQuote | undefined {
  const row = database
    .select()
    .from(indexQuotes)
    .where(eq(indexQuotes.code, code))
    .get();
  return row === undefined ? undefined : indexQuoteOf(row);
}

/** The latest quote of a stock, or undefined while Portolab has none, such as before the first update of prices after the stock joins the stocks that Portolab tracks. */
export function findStockQuote(
  database: Database,
  code: string,
): StockQuote | undefined {
  const row = database
    .select()
    .from(stockQuotes)
    .where(eq(stockQuotes.code, code))
    .get();
  return row === undefined ? undefined : stockQuoteOf(row);
}

/** The quotes of the stocks that the latest attempt of the quote job fetched, by code. A stock that the attempt could not update keeps an older quote, which can be a price that the market left hours ago, as issue #40 explains, so its quote is left out, and every quote is left out when the attempt failed. */
export function listFreshStockQuotes(
  database: DatabaseWriter,
): Map<string, StockQuote> {
  const fresh = new Map<string, StockQuote>();
  const attempt = readLatestUpdateAttempt(database, "quotes");
  if (attempt?.succeeded !== true) {
    return fresh;
  }
  for (const row of database.select().from(stockQuotes).all()) {
    if (!attempt.failedCodes.includes(row.code)) {
      fresh.set(row.code, stockQuoteOf(row));
    }
  }
  return fresh;
}

function indexQuoteOf(row: typeof indexQuotes.$inferSelect): IndexQuote {
  return {
    kind: "index",
    code: row.code,
    level: row.level,
    previousLevel: row.previousLevel,
    quotedAt: row.quotedAt,
  };
}

function stockQuoteOf(row: typeof stockQuotes.$inferSelect): StockQuote {
  return {
    kind: "stock",
    code: row.code,
    price: row.price,
    previousClose: row.previousClose,
    quotedAt: row.quotedAt,
  };
}
