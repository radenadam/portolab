import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import type { Database } from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { testDatabasePath } from "./test-database-path.ts";

/** Opens the database of the test server, hands it to a write, and closes it again. */
export function writeTestDatabase(write: (database: Database) => void): void {
  const database = openDatabase(
    testDatabasePath(),
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  try {
    write(database);
  } finally {
    closeDatabase(database);
  }
}
