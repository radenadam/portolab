import type { ChildProcess } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import { secondMilliseconds } from "../app/time-units.ts";

/** How the wait for a server ended: it answered, the process that runs it stopped for a reason, or the time ran out. */
export type HealthWait =
  | { kind: "answered" }
  | { kind: "stopped"; reason: string }
  | { kind: "timedOut" };

interface HealthWaitOptions {
  timeoutSeconds: number;
  /** Each request ends after this, so a server that hangs costs one attempt instead of the whole wait. */
  requestTimeoutSeconds: number;
  /** Why the process that runs the server stopped, or undefined while it runs, such as the code or the signal of a child process. */
  stopReason: () => string | undefined;
}

const pauseMilliseconds = 250;

/** Asks a server for its health until it answers, until the process that runs it stops, or until the time runs out. It asks at least once, so a time of zero asks whether a server answers now. */
export async function waitForHealth(
  healthUrl: string,
  options: HealthWaitOptions,
): Promise<HealthWait> {
  const deadline = Date.now() + options.timeoutSeconds * secondMilliseconds;
  for (;;) {
    const reason = options.stopReason();
    if (reason !== undefined) {
      return { kind: "stopped", reason };
    }
    if (await answersHealth(healthUrl, options.requestTimeoutSeconds)) {
      return { kind: "answered" };
    }
    if (Date.now() >= deadline) {
      return { kind: "timedOut" };
    }
    await pause(pauseMilliseconds);
  }
}

async function answersHealth(
  healthUrl: string,
  requestTimeoutSeconds: number,
): Promise<boolean> {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(requestTimeoutSeconds * secondMilliseconds),
    });
    return response.ok;
  } catch {
    // The server is not listening yet, so the connection is refused or the request runs out of time.
    return false;
  }
}

/** Follows the end of a child process. A child that a signal ends keeps exitCode at null, so only the exit event tells that it stopped and why. */
export function watchExit(child: ChildProcess): {
  reason: () => string | undefined;
  exited: Promise<void>;
} {
  let exitReason: string | undefined;
  const exited = new Promise<void>((resolve) => {
    child.once("exit", (code, signal) => {
      exitReason =
        signal === null ? `code ${String(code)}` : `signal ${signal}`;
      resolve();
    });
  });
  return { reason: () => exitReason, exited };
}
