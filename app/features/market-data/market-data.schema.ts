import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** The latest delayed quote of each tracked instrument. Stock prices are whole rupiah, and index levels are points. */
export const latestQuotes = sqliteTable("latest_quotes", {
  code: text("code").primaryKey(),
  kind: text("kind", { enum: ["stock", "index"] }).notNull(),
  price: real("price").notNull(),
  previousClose: real("previous_close").notNull(),
  quotedAt: integer("quoted_at", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});
