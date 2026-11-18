import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { users } from "../accounts/accounts.schema.ts";
import type { UserId } from "../accounts/accounts.schema.ts";

/** A person's preferences span their classes. An entry lives until they remove its star or the server owner deletes their account. */
export const watchlist = sqliteTable(
  "watchlist",
  {
    userId: integer("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    addedAt: integer("added_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.code] })],
);
