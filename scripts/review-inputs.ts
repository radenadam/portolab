import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";

/** Reads the number of the pull request that the review is posted on. */
export function parsePullRequestNumber(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[1-9]\d*$/.test(value)
    ? succeed(value)
    : fail(
        `${source} must be a pull request number, but it is ${describeValue(value)}.`,
      );
}

/** Reads the full hash of a commit, such as the head of a pull request. */
export function parseCommitHash(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value)
    ? succeed(value)
    : fail(
        `${source} must be the full hash of a commit, but it is ${describeValue(value)}.`,
      );
}

/** Reads a field that holds the full hash of a commit or nothing, such as the head of a state before any round finished. */
export function parseOptionalCommitHashAt(
  value: unknown,
  source: string,
  field: string,
): Result<string | undefined, string> {
  const hash = isRecord(value) ? value[field] : undefined;
  return hash === undefined
    ? succeed(undefined)
    : parseCommitHash(hash, `${source}: ${field}`);
}

/** Reads the tools that an agent definition lists on its line that starts with "tools: ". */
export function parseAgentTools(
  value: unknown,
  source: string,
): Result<string, string> {
  const line =
    typeof value === "string" ? /^tools: (.*)$/m.exec(value)?.[1] : undefined;
  const tools = line?.replaceAll(" ", "") ?? "";
  return /^[A-Za-z]+(,[A-Za-z]+)*$/.test(tools)
    ? succeed(tools)
    : fail(
        `${source} must list its tools on one line that starts with "tools: ", separated by commas, but that list is ${describeValue(line)}.`,
      );
}
