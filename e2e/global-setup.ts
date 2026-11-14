import { saveFixtureHistoryForTest } from "../app/features/market-data/save-fixture-history-for-test.server.ts";
import { spawn } from "node:child_process";
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
import { waitForHealth, watchExit } from "../scripts/wait-for-health.ts";
import { baseUrl, databasePathVariable, serverPort } from "./test-server.ts";

const serverMain = join(import.meta.dirname, "..", "server", "main.ts");
const healthUrl = `${baseUrl}/health`;
const startupTimeoutSeconds = 60;
const requestTimeoutSeconds = 5;

/** Starts the server of the browser tests on a database file in a new temporary folder, and returns the teardown that stops the server and removes the folder. The tests create accounts with the account command, which needs a file that both processes open, so the database cannot stay in memory. */
export default async function globalSetup(): Promise<() => Promise<void>> {
  // A server that already answers would be tested instead of this build.
  const existing = await waitForHealth(healthUrl, {
    timeoutSeconds: 0,
    requestTimeoutSeconds,
    stopReason: () => undefined,
  });
  if (existing.kind === "answered") {
    throw new Error(
      `Another server already answers on port ${String(serverPort)}, so the browser tests would test it instead of this build. Stop that server first.`,
    );
  }
  const folder = mkdtempSync(join(tmpdir(), "portolab-e2e-"));
  const databasePath = join(folder, "portolab.sqlite");
  try {
    storePricesOfTests(databasePath, new Date());
  } catch (error) {
    rmSync(folder, { recursive: true, force: true });
    throw error;
  }
  // The server starts outside the repository, so a file that it finds from the working directory instead of from its code fails every browser test.
  const server = spawn(process.execPath, [serverMain], {
    cwd: tmpdir(),
    env: {
      ...process.env,
      PORT: String(serverPort),
      DATABASE_PATH: databasePath,
      PRICE_SOURCE: "fixture",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const serverExit = watchExit(server);
  const stop = async (): Promise<void> => {
    if (serverExit.reason() === undefined) {
      server.kill();
      await serverExit.exited;
    }
    rmSync(folder, { recursive: true, force: true });
  };
  const wait = await waitForHealth(healthUrl, {
    timeoutSeconds: startupTimeoutSeconds,
    requestTimeoutSeconds,
    stopReason: serverExit.reason,
  });
  switch (wait.kind) {
    case "answered":
      process.env[databasePathVariable] = databasePath;
      return stop;
    case "stopped":
      await stop();
      throw new Error(
        `The server of the browser tests stopped with ${wait.reason} before it answered on /health.`,
      );
    case "timedOut":
      await stop();
      throw new Error(
        `The server of the browser tests did not answer on /health within ${String(startupTimeoutSeconds)} seconds.`,
      );
  }
}

/** Seeding both month-end and daily histories lets the tests exercise measures and sparklines even when the fixture source lacks the history job's requested day. Keeping the older UNVR quote also distinguishes a missed update from a price never stored. */
function storePricesOfTests(databasePath: string, now: Date): void {
  const database = openDatabase(
    databasePath,
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  saveFixtureHistoryForTest(database, ["IHSG", "BBCA", "AMMN", "AADI"]);
  saveQuotes(database, [unvrCloseForTest], now);
  closeDatabase(database);
}
