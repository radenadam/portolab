import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

const modes = ["development", "production"] as const;

export type Mode = (typeof modes)[number];

/** Reads whether the server runs the development build with Vite or the production build. */
export function parseMode(
  value: unknown,
  source: string,
): Result<Mode, string> {
  const mode = modes.find((candidate) => candidate === value);
  return mode === undefined
    ? fail(
        `${source} must be "development" or "production", but it is "${String(value)}".`,
      )
    : succeed(mode);
}

/** Reads the port that the server listens on. */
export function parsePort(
  value: unknown,
  source: string,
): Result<number, string> {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const port = Number(value);
    if (port >= 1 && port <= 65_535) {
      return succeed(port);
    }
  }
  return fail(
    `${source} must be a whole number from 1 to 65535, but it is "${String(value)}".`,
  );
}
