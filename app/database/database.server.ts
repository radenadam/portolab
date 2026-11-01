import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import type { RunResult } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { createContext } from "react-router";

export type Database = BetterSQLite3Database & {
  $client: BetterSqlite3.Database;
};

/** The database or a transaction in it, for a write that its caller may group with others in one transaction. */
export type DatabaseWriter = BaseSQLiteDatabase<"sync", RunResult>;

/** Opens the database file, creating it and its folder when they do not exist, and applies every pending migration from the folder. */
export function openDatabase(path: string, migrationsFolder: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const client = new BetterSqlite3(path);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");
  const database = drizzle({ client });
  migrate(database, { migrationsFolder });
  return database;
}

export function closeDatabase(database: Database): void {
  database.$client.close();
}

// The server owns the connection and hands it to every loader and action, so the dev server can reload this module after an edit without losing it.
export const databaseContext = createContext<Database>();
