import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
