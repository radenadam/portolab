import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { waitForHealth, watchExit } from "../scripts/wait-for-health.ts";
import { serverStartupFailure } from "./server-startup-failure.ts";

/** Every isolated browser server uses the same health deadline and stops its own child before its database is removed. */
export async function startTestServer({
  databasePath,
  port,
}: {
  databasePath: string;
  port: number;
}): Promise<() => Promise<void>> {
  const healthUrl = `http://localhost:${String(port)}/health`;
  const requestTimeoutSeconds = 5;
  const startupTimeoutSeconds = 60;
  const existing = await waitForHealth(healthUrl, {
    timeoutSeconds: 0,
    requestTimeoutSeconds,
    stopReason: () => undefined,
  });
  if (existing.kind === "answered")
    throw new Error(
      `Another server already answers on port ${String(port)}, so the browser tests would test it instead of this build. Stop that server first.`,
    );
  // Starting outside the repository catches a shipped file that the server finds from its working directory.
  const server = spawn(
    process.execPath,
    [join(import.meta.dirname, "..", "server", "main.ts")],
    {
      cwd: tmpdir(),
      env: {
        ...process.env,
        PORT: String(port),
        DATABASE_PATH: databasePath,
        PRICE_SOURCE: "fixture",
      },
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
  const serverExit = watchExit(server);
  const stop = async (): Promise<void> => {
    if (serverExit.reason() === undefined) {
      server.kill();
      await serverExit.exited;
    }
  };
  const wait = await waitForHealth(healthUrl, {
    timeoutSeconds: startupTimeoutSeconds,
    requestTimeoutSeconds,
    stopReason: serverExit.reason,
  });
  const failure = serverStartupFailure(wait, healthUrl, startupTimeoutSeconds);
  if (failure === undefined) return stop;
  await stop();
  throw new Error(failure);
}
