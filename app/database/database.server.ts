import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as marketDataSchema from "~/features/market-data/market-data.schema";

const schema = { ...marketDataSchema };

export type Database = BetterSQLite3Database<typeof schema>;

let connection:
  { client: BetterSqlite3.Database; database: Database } | undefined;

/** Opens the database file, creating it when it does not exist, and applies every pending migration. */
export function connectDatabase(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const client = new BetterSqlite3(path);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");
  const database = drizzle({ client, schema });
  // The server starts from the repository root, where the migrations live.
  migrate(database, { migrationsFolder: "migrations" });
  connection = { client, database };
}

export function database(): Database {
  if (connection === undefined) {
    throw new Error(
      "The database is connected at startup, before the server accepts requests.",
    );
  }
  return connection.database;
}

export function disconnectDatabase(): void {
  connection?.client.close();
  connection = undefined;
}
