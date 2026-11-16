import type { HealthWait } from "../scripts/wait-for-health.ts";

export function serverStartupFailure(
  wait: HealthWait,
  healthUrl: string,
  timeoutSeconds: number,
): string | undefined {
  switch (wait.kind) {
    case "answered":
      return undefined;
    case "stopped":
      return `The browser test server stopped with ${wait.reason} before it answered at ${healthUrl}.`;
    case "timedOut":
      return `The browser test server did not answer at ${healthUrl} within ${String(timeoutSeconds)} seconds.`;
  }
}
