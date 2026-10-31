import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Rupiah } from "~/units/rupiah";

/** The latest delayed quote of each tracked stock, in whole rupiah. */
export const stockQuotes = sqliteTable("stock_quotes", {
  code: text("code").primaryKey(),
  price: integer("price").$type<Rupiah>().notNull(),
  previousClose: integer("previous_close").$type<Rupiah>().notNull(),
  quotedAt: integer("quoted_at", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});

/** The latest delayed level of each tracked index, in points with two decimals. */
export const indexQuotes = sqliteTable("index_quotes", {
  code: text("code").primaryKey(),
  level: real("level").notNull(),
  previousLevel: real("previous_level").notNull(),
  quotedAt: integer("quoted_at", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});

// Only the latest attempt matters, so the table holds one row, whose id is always 1.
/** The latest attempt to update prices, so the prices page can say when the source failed. */
export const priceUpdates = sqliteTable("price_updates", {
  id: integer("id").primaryKey(),
  attemptedAt: integer("attempted_at", { mode: "timestamp_ms" }).notNull(),
  succeeded: integer("succeeded", { mode: "boolean" }).notNull(),
});
