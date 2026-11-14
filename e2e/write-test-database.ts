import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import type { Database } from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { testDatabasePath } from "./test-database-path.ts";

/** Keeps the database open until a write finishes, including a write that awaits a password hash. */
export function writeTestDatabase(
  write: (database: Database) => Promise<void>,
): Promise<void>;
export function writeTestDatabase(write: (database: Database) => void): void;
export function writeTestDatabase(
  write: (database: Database) => void | Promise<void>,
): void | Promise<void> {
  const database = openDatabase(
    testDatabasePath(),
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  let written: void | Promise<void>;
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
