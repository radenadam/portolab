import { saveFixtureHistoryForTest } from "../app/features/market-data/save-fixture-history-for-test.server.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { unvrCloseForTest } from "../app/features/market-data/left-out-quotes-for-test.ts";
import { saveQuotes } from "../app/features/market-data/quote-store.server.ts";
import { databasePathVariable, serverPort } from "./test-server.ts";
import { startTestServer } from "./start-test-server.ts";

/** The account command and server share a file, which the teardown removes only after the child stops. */
export default async function globalSetup(): Promise<() => Promise<void>> {
  const folder = mkdtempSync(join(tmpdir(), "portolab-e2e-"));
  const databasePath = join(folder, "portolab.sqlite");
  try {
    storePricesOfTests(databasePath, new Date());
    const stop = await startTestServer({ databasePath, port: serverPort });
    process.env[databasePathVariable] = databasePath;
    return async () => {
      await stop();
      rmSync(folder, { recursive: true, force: true });
    };
  } catch (error) {
    rmSync(folder, { recursive: true, force: true });
    throw error;
  }
}

/** Seeding both month-end and daily histories lets the tests exercise measures and sparklines even when the fixture source lacks the history job's requested day. Keeping the older UNVR quote also distinguishes a missed update from a price never stored. */
function storePricesOfTests(databasePath: string, now: Date): void {
  const database = openDatabase(
    databasePath,
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  try {
    saveFixtureHistoryForTest(database, [
      "IHSG",
      "BBCA",
      "TLKM",
      "AMMN",
      "AADI",
    ]);
    saveQuotes(database, [unvrCloseForTest], now);
  } finally {
    closeDatabase(database);
  }
}
