import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { PasswordHash } from "./password.server.ts";
import type { Username } from "./username.ts";

/** The number that identifies a person's account. */
export type UserId = number & { readonly brand: "UserId" };

const roles = ["lecturer", "student"] as const;

/** What a person does in Portolab. A lecturer teaches classes, and a student joins them. */
export type Role = (typeof roles)[number];

/** Every person who can sign in. A lecturer whom the server owner created has no name and no consent until the first sign-in, where the lecturer gives both. */
export const users = sqliteTable("users", {
  id: integer("id").$type<UserId>().primaryKey({ autoIncrement: true }),
  username: text("username").$type<Username>().notNull().unique(),
  name: text("name"),
  role: text("role", { enum: roles }).notNull(),
  passwordHash: text("password_hash").$type<PasswordHash>().notNull(),
  /** Whether the password is a temporary one, which the person replaces at the next sign-in. */
  mustChangePassword: integer("must_change_password", {
    mode: "boolean",
  }).notNull(),
  consentedAt: integer("consented_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Each device where a person is signed in. The cookie holds the id and a secret, and the table holds only a hash of the secret, so a copy of the database cannot sign anyone in. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    secretHash: blob("secret_hash", { mode: "buffer" }).notNull(),
    userId: integer("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("sessions_user_id_index").on(table.userId),
    index("sessions_last_used_at_index").on(table.lastUsedAt),
  ],
);
