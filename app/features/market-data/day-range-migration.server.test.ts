import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { join } from "node:path";
import { expect, test } from "vitest";
import { migrationsFolderName } from "~/database/migrations-folder-name";
import { findStockQuote, saveQuotes } from "./quote-store.server";
import { stockQuote } from "./stock-quote";

test("preserves an older quote without inventing daily bounds and stores the next complete range", () => {
  const client = new BetterSqlite3(":memory:");
  try {
    const migrations = readMigrationFiles({
      migrationsFolder: join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        migrationsFolderName,
      ),
    });
    const rangeIndex = migrations.findIndex((migration) =>
      migration.sql.some((sql) => sql.includes("`day_low`")),
    );
    expect(rangeIndex).toBeGreaterThan(0);
    for (const migration of migrations.slice(0, rangeIndex)) {
      for (const sql of migration.sql) client.exec(sql);
    }
    const quote = stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55Z");
    client
      .prepare(
        "INSERT INTO stock_quotes (code, price, previous_close, quoted_at, fetched_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        quote.code,
        quote.price,
        quote.previousClose,
        quote.quotedAt.getTime(),
        quote.quotedAt.getTime(),
      );
    expect(
      client.prepare("SELECT count(*) AS count FROM stock_quotes").get(),
    ).toEqual({ count: 1 });
    for (const migration of migrations.slice(rangeIndex)) {
      for (const sql of migration.sql) client.exec(sql);
    }
    const database = drizzle({ client });
    expect(findStockQuote(database, "BBCA")).toEqual(quote);
    expect(
      client.prepare("SELECT day_low, day_high FROM stock_quotes").get(),
    ).toEqual({ day_low: null, day_high: null });
    const complete = stockQuote(
      "BBCA",
      [4980, 4940, [4900, 5025]],
      "2026-10-30T09:14:55Z",
    );
    saveQuotes(database, [complete], complete.quotedAt);
    expect(findStockQuote(database, "BBCA")).toEqual(complete);
  } finally {
    client.close();
  }
});
