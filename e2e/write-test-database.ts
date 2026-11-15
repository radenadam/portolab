import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import type { Database } from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { testDatabasePath } from "./test-database-path.ts";

/** Keeps the database open until a write finishes, including a write that awaits a password hash. */
export function writeTestDatabase<Value>(
  write: (database: Database) => Promise<Value>,
): Promise<Value>;
export function writeTestDatabase<Value>(
  write: (database: Database) => Value,
): Value;
export function writeTestDatabase(
  write: (database: Database) => unknown,
): unknown {
  const database = openDatabase(
    testDatabasePath(),
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  let written: unknown;
  try {
    written = write(database);
  } catch (error) {
    closeDatabase(database);
    throw error;
  }
  if (written instanceof Promise) {
    return written.finally(() => {
      closeDatabase(database);
    });
  }
  closeDatabase(database);
  return written;
}
