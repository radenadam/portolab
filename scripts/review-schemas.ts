import type { Result } from "../app/result.ts";
import { parseStringsAt } from "./json.ts";

/** The schemas that define the answers of the agents in the review workflow. */
export const reviewSchemaPaths = {
  route: ".github/review/route.schema.json",
  lensReport: ".github/review/lens-report.schema.json",
  verifiedFindings: ".github/review/verified-findings.schema.json",
};

/** Reads the names of the lenses from the schema of the router's answer. */
export function parseRouteSchemaLenses(
  value: unknown,
  source: string,
): Result<string[], string> {
  return parseStringsAt(value, source, {
    keys: ["properties", "lenses", "items", "enum"],
    mayBeEmpty: false,
  });
}
