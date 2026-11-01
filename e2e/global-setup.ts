import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { baseUrl, databasePathVariable, serverPort } from "./test-server.ts";

const serverMain = join(import.meta.dirname, "..", "server", "main.ts");
const startupTimeoutSeconds = 60;
const requestTimeoutSeconds = 5;

/** Starts the server of the browser tests on a database file in a new temporary folder, and returns the teardown that stops the server and removes the folder. The tests create accounts with the account command, which needs a file that both processes open, so the database cannot stay in memory. */
export default async function globalSetup(): Promise<() => Promise<void>> {
  // A server that already answers would be tested instead of this build.
  if (await answersHealth()) {
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
  // A child that a signal ends keeps exitCode at null, so only the exit event tells that the server stopped and why.
  let exitReason: string | undefined;
  const exited = new Promise<void>((resolve) => {
    server.once("exit", (code, signal) => {
      exitReason =
        signal === null ? `code ${String(code)}` : `signal ${signal}`;
      resolve();
    });
  });
  const stop = async (): Promise<void> => {
    if (exitReason === undefined) {
      server.kill();
      await exited;
    }
    rmSync(folder, { recursive: true, force: true });
  };
  try {
    await waitForHealth(() => exitReason);
  } catch (error) {
    await stop();
    throw error;
  }
  process.env[databasePathVariable] = databasePath;
  return stop;
}

async function waitForHealth(
  exitReason: () => string | undefined,
): Promise<void> {
  const deadline = Date.now() + startupTimeoutSeconds * 1000;
  while (Date.now() < deadline) {
    const reason = exitReason();
    if (reason !== undefined) {
      throw new Error(
        `The server of the browser tests stopped with ${reason} before it answered on /health.`,
      );
    }
    if (await answersHealth()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `The server of the browser tests did not answer on /health within ${String(startupTimeoutSeconds)} seconds.`,
  );
}

async function answersHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(requestTimeoutSeconds * 1000),
    });
    return response.ok;
  } catch {
    // The server is not listening yet, so the connection is refused or the request runs out of time.
    return false;
  }
}
