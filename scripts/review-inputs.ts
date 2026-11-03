import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import { notAnObject, parseStringAt } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import type { Lens } from "./review-lenses.ts";

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

/** Reads the name of a branch, such as the base branch of a pull request, which a command of git then names as a remote branch. */
export function parseBranchName(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[\w.-]+(\/[\w.-]+)*$/.test(value)
    ? succeed(value)
    : fail(
        `${source} must be the name of a branch, but it is ${describeValue(value)}.`,
      );
}

/** Reads the tools of every lens of a round, because the reviewer applies them all in one session, as one list for the agent. */
export function readLensTools(
  chosenLenses: readonly Lens[],
): Result<string, string> {
  const tools = new Set<string>();
  for (const lens of chosenLenses) {
    const path = `.claude/agents/review-${lens}.md`;
    const definition = readTextFile(path);
    const lensTools = definition.ok
      ? parseAgentTools(definition.value, path)
      : definition;
    if (!lensTools.ok) {
      return lensTools;
    }
    for (const tool of lensTools.value.split(",")) {
      tools.add(tool);
    }
  }
  return succeed([...tools].join(","));
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

/** Reads the result of each job from the needs context of the workflow. */
export function parseJobResults(
  value: unknown,
  source: string,
): Result<Record<string, string>, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  if (Object.keys(value).length === 0) {
    return fail(
      `${source} must name at least one job, but it is ${describeValue(value)}.`,
    );
  }
  const results: Record<string, string> = {};
  for (const [job, details] of Object.entries(value)) {
    const result = parseStringAt(details, `${source}: job ${job}`, ["result"]);
    if (!result.ok) {
      return result;
    }
    results[job] = result.value;
  }
  return succeed(results);
}
