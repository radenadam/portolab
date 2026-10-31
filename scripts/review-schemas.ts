import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray, notAnObject } from "./json.ts";

/** The schemas that define the answers of the agents in the review workflow. */
export const reviewSchemaPaths = {
  route: ".github/review/route.schema.json",
  lensReport: ".github/review/lens-report.schema.json",
  verifiedFindings: ".github/review/verified-findings.schema.json",
};

/** Reads the list of strings at a path of keys in a schema, such as the names of the lenses or the fields that a finding requires. */
export function parseSchemaStrings(
  value: unknown,
  source: string,
  keys: readonly string[],
): Result<string[], string> {
  let current = value;
  for (const key of keys) {
    current = isRecord(current) ? current[key] : undefined;
  }
  return isStringArray(current) && current.length > 0
    ? succeed(current)
    : fail(`${source} has no list of strings at ${keys.join(".")}.`);
}

/** Reads the names of the lenses from the schema of the router's answer. */
export function parseRouteSchemaLenses(
  value: unknown,
  source: string,
): Result<string[], string> {
  return parseSchemaStrings(value, source, [
    "properties",
    "lenses",
    "items",
    "enum",
  ]);
}

/** Reads a schema as an object, so that it can be passed on to an agent as one line of JSON. */
export function parseSchema(
  value: unknown,
  source: string,
): Result<Record<string, unknown>, string> {
  return isRecord(value) ? succeed(value) : notAnObject(source);
}
