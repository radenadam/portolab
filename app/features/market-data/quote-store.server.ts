import { asc } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { isRupiah } from "~/units/rupiah";
import { latestQuotes } from "./market-data.schema";
import type { Quote } from "./price-source.server";

export function saveQuotes(
  database: Database,
  quotes: readonly Quote[],
  fetchedAt: Date,
): void {
  database.transaction((transaction) => {
    for (const quote of quotes) {
      const row = {
        code: quote.code,
        kind: quote.kind,
        price: quote.kind === "stock" ? quote.price : quote.level,
        previousClose:
          quote.kind === "stock" ? quote.previousClose : quote.previousLevel,
        quotedAt: quote.quotedAt,
        fetchedAt,
      };
      transaction
        .insert(latestQuotes)
        .values(row)
        .onConflictDoUpdate({ target: latestQuotes.code, set: row })
        .run();
    }
  });
}

export function listLatestQuotes(database: Database): Quote[] {
  const rows = database
    .select()
    .from(latestQuotes)
    .orderBy(asc(latestQuotes.kind), asc(latestQuotes.code))
    .all();
  return rows.map((row): Quote => {
    if (row.kind === "index") {
      return {
        kind: "index",
        code: row.code,
        level: row.price,
        previousLevel: row.previousClose,
        quotedAt: row.quotedAt,
      };
    }
    // Only saveQuotes writes this table, and it writes stock prices from Quote values, which are whole rupiah.
    if (!isRupiah(row.price) || !isRupiah(row.previousClose)) {
      throw new Error(`The stored price of ${row.code} is not a whole rupiah.`);
    }
    return {
      kind: "stock",
      code: row.code,
      price: row.price,
      previousClose: row.previousClose,
      quotedAt: row.quotedAt,
    };
  });
}
