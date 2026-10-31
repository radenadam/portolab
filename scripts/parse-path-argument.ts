import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

/** Reads a command-line argument that names a file. */
export function parsePathArgument(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value === "string" && value !== "") {
    return succeed(value);
  }
  const given = value === undefined ? "missing" : JSON.stringify(value);
  return fail(`${source} must be the path of a file, but it is ${given}.`);
}
