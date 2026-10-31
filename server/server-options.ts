import { parseArgs } from "node:util";
import { errorMessage } from "../app/error-message.ts";
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

/** Reads the command line of the server, whose only option is --mode. */
export function parseCommandLine(
  value: unknown,
  source: string,
): Result<Mode, string> {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    return fail(`${source} must be a list of arguments.`);
  }
  try {
    const { values } = parseArgs({
      args: value,
      options: { mode: { type: "string", default: "production" } },
    });
    return parseMode(values.mode, "--mode");
  } catch (error) {
    return fail(
      `${source} is not valid, so the server cannot start. Node reported: ${errorMessage(error)}`,
    );
  }
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
