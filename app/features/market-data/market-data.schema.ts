import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { IndexPoints } from "~/units/index-points";
import type { Rupiah } from "~/units/rupiah";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { IndexCode } from "./price-source.server";

/** The latest delayed quote of each tracked stock, in whole rupiah. */
export const stockQuotes = sqliteTable("stock_quotes", {
  code: text("code").primaryKey(),
  price: integer("price").$type<Rupiah>().notNull(),
  previousClose: integer("previous_close").$type<Rupiah>().notNull(),
  quotedAt: integer("quoted_at", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});

/** The latest delayed level of each tracked index, in points. */
export const indexQuotes = sqliteTable("index_quotes", {
  code: text("code").$type<IndexCode>().primaryKey(),
  level: real("level").$type<IndexPoints>().notNull(),
  previousLevel: real("previous_level").$type<IndexPoints>().notNull(),
  quotedAt: integer("quoted_at", { mode: "timestamp_ms" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});

// Only the latest attempt of each job matters, so the table holds one row for each job.
/** The latest attempt of each job that updates prices, so the job knows how long to wait after failures and the prices page can say when the source failed. */
export const priceUpdates = sqliteTable("price_updates", {
  id: integer("id").primaryKey(),
  attemptedAt: integer("attempted_at", { mode: "timestamp_ms" }).notNull(),
  succeeded: integer("succeeded", { mode: "boolean" }).notNull(),
  consecutiveFailures: integer("consecutive_failures").notNull(),
  failedCodes: text("failed_codes", { mode: "json" })
    .$type<string[]>()
    .notNull(),
});

/** The close of each tracked stock on each trading day, adjusted for its later splits. The date is in WIB, such as 2026-10-30. */
export const stockDailyCloses = sqliteTable(
  "stock_daily_closes",
  {
    code: text("code").notNull(),
    date: text("date").notNull(),
    close: real("close").$type<SplitAdjustedRupiah>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.code, table.date] })],
);

/** The closing level of each tracked index on each trading day. The date is in WIB, such as 2026-10-30. */
export const indexDailyCloses = sqliteTable(
  "index_daily_closes",
  {
    code: text("code").$type<IndexCode>().notNull(),
    date: text("date").notNull(),
    close: real("close").$type<IndexPoints>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.code, table.date] })],
);
