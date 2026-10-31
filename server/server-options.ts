import { parseArgs } from "node:util";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChoice, parseFilePath } from "../app/value-parsers.ts";
import { describeValue, isStringArray } from "../app/value-shapes.ts";

const modes = ["development", "production"] as const;

export type Mode = (typeof modes)[number];

const priceSourceNames = ["yahoo", "fixture"] as const;

// README.md lists each default for the people who run the server, and a test checks that it lists these.
const defaultPort = 3000;
const defaultPriceSource: (typeof priceSourceNames)[number] = "yahoo";
const defaultDatabasePath = "data/portolab.sqlite";

/** The settings of the services that the server starts. README.md lists each variable and its default. */
export interface ServiceSettings {
  databasePath: string;
  priceSource: (typeof priceSourceNames)[number];
}

/** Reads the command line of the server, whose only option is --mode. */
export function parseCommandLine(
  value: unknown,
  source: string,
): Result<Mode, string> {
  if (!isStringArray(value)) {
    return fail(
      `${source} must be a list of arguments, but it is ${describeValue(value)}.`,
    );
  }
  try {
    const { values } = parseArgs({
      args: value,
      options: { mode: { type: "string", default: "production" } },
    });
    return parseChoice(values.mode, "--mode", modes);
  } catch (error) {
    return fail(
      `${source} must hold only the option --mode, but it is ${describeValue(value)}. Node reported: ${errorMessage(error)}`,
    );
  }
}

/** Reads the port that the server listens on, or the default port when the variable is not set. */
export function parsePort(
  value: unknown,
  source: string,
): Result<number, string> {
  if (value === undefined) {
    return succeed(defaultPort);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const port = Number(value);
    if (port >= 1 && port <= 65_535) {
      return succeed(port);
    }
  }
  return fail(
    `${source} must be a whole number from 1 to 65535, but it is ${describeValue(value)}.`,
  );
}

/** Reads the source of prices, or the default source when the variable is not set. */
export function parsePriceSource(
  value: unknown,
  source: string,
): Result<ServiceSettings["priceSource"], string> {
  return parseChoice(value ?? defaultPriceSource, source, priceSourceNames);
}

/** Reads the place of the database file, or the default place when the variable is not set. */
export function parseDatabasePath(
  value: unknown,
  source: string,
): Result<string, string> {
  return parseFilePath(value ?? defaultDatabasePath, source);
}
