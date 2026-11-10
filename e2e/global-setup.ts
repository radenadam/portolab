import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { fixtureHistory } from "../app/features/market-data/fixture-history.ts";
import { saveDailyHistory } from "../app/features/market-data/history-store.server.ts";
import { marketIndex } from "../app/features/market-data/tracked-instruments.ts";
import { monthEndClosesForTest } from "../app/features/measures/month-end-closes-for-test.ts";
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
    storeClosesOfTests(databasePath);
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

/** Stores the recorded month-end closes of the IHSG, of BBCA, which has the monthly returns that a purchase needs, of AMMN, which listed later and so lies against another security market line, and of AADI, which has too few, and the closes of the IHSG and ITMG in the last week of October 2026 that the fixture source records, which the chart of a portfolio needs. The history job of the server asks the fixture source for the closes of the latest trading day, which its closes of October 2026 lack, so it stores none. The closes of October leave that month without a later close of the IHSG, so the count of monthly returns stays as the month-end closes give it. */
function storeClosesOfTests(databasePath: string): void {
  const database = openDatabase(
    databasePath,
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  for (const code of ["IHSG", "BBCA", "AMMN", "AADI"] as const) {
    saveDailyHistory(database, monthEndClosesForTest(code));
  }
  for (const instrument of [
    marketIndex,
    { kind: "stock", code: "ITMG" },
  ] as const) {
    const history = fixtureHistory(instrument, "2026-10-26");
    if (history === undefined) {
      throw new Error(`The fixture records no closes of ${instrument.code}.`);
    }
    saveDailyHistory(database, history);
  }
  closeDatabase(database);
}
