import { asc } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { indexQuotes, priceUpdates, stockQuotes } from "./market-data.schema";
import type { Quote } from "./price-source.server";

export interface UpdateAttempt {
  attemptedAt: Date;
  /** Whether the source answered with at least one usable quote. */
  succeeded: boolean;
  /** The failures in a row up to this attempt, which decide how long the job waits before the next one. */
  consecutiveFailures: number;
  /** The codes of the instruments that this attempt could not update, which are all of them when it failed. */
  failedCodes: string[];
}

// The schema explains why price_updates holds one row.
const latestAttemptId = 1;

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
    quotes.push({
      kind: "index",
      code: row.code,
      level: row.level,
      previousLevel: row.previousLevel,
      quotedAt: row.quotedAt,
    });
  }
  for (const row of database
    .select()
    .from(stockQuotes)
    .orderBy(asc(stockQuotes.code))
    .all()) {
    quotes.push({
      kind: "stock",
      code: row.code,
      price: row.price,
      previousClose: row.previousClose,
      quotedAt: row.quotedAt,
    });
  }
  return quotes;
}

export function saveUpdateAttempt(
  database: Database,
  attempt: UpdateAttempt,
): void {
  const row = { id: latestAttemptId, ...attempt };
  database
    .insert(priceUpdates)
    .values(row)
    .onConflictDoUpdate({ target: priceUpdates.id, set: row })
    .run();
}

export function readLatestUpdateAttempt(
  database: Database,
): UpdateAttempt | undefined {
  const [row] = database.select().from(priceUpdates).all();
  return row === undefined
    ? undefined
    : {
        attemptedAt: row.attemptedAt,
        succeeded: row.succeeded,
        consecutiveFailures: row.consecutiveFailures,
        failedCodes: row.failedCodes,
      };
}
