import { parseArgs } from "node:util";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChoice, parseFilePath } from "../app/value-parsers.ts";
import { describeValue, isStringArray } from "../app/value-shapes.ts";

const modes = ["development", "production"] as const;

export type Mode = (typeof modes)[number];

const priceSourceNames = ["yahoo", "fixture"] as const;

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

/** Reads the port that the server listens on, which is 3000 unless the variable names another. */
export function parsePort(
  value: unknown,
  source: string,
): Result<number, string> {
  if (value === undefined) {
    return succeed(3000);
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

/** Reads the source of prices, which is Yahoo Finance unless the variable names the fixture for tests. */
export function parsePriceSource(
  value: unknown,
  source: string,
): Result<ServiceSettings["priceSource"], string> {
  return parseChoice(value ?? "yahoo", source, priceSourceNames);
}

/** Reads the place of the database file, which is data/portolab.sqlite unless the variable names another. */
export function parseDatabasePath(
  value: unknown,
  source: string,
): Result<string, string> {
  return parseFilePath(value ?? "data/portolab.sqlite", source);
}
