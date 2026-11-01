import { onTestFinished } from "vitest";
import { closeDatabase, openDatabase } from "./database.server";
import type { Database } from "./database.server";
import { join } from "node:path";
import { migrationsFolderName } from "./migrations-folder-name";

/** Opens an empty database in memory for one test, and closes it when the test finishes. */
export function openDatabaseForTest(): Database {
  const database = openDatabase(
    ":memory:",
    join(import.meta.dirname, "..", "..", migrationsFolderName),
  );
  onTestFinished(() => {
    closeDatabase(database);
  });
  return database;
}
