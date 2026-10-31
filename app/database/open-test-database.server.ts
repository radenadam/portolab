import { onTestFinished } from "vitest";
import { closeDatabase, openDatabase } from "./database.server";
import type { Database } from "./database.server";

/** Opens an empty database in memory for one test, and closes it when the test finishes. */
export function openTestDatabase(): Database {
  const database = openDatabase(":memory:");
  onTestFinished(() => {
    closeDatabase(database);
  });
  return database;
}
