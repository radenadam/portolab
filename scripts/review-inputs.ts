import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray } from "../app/value-shapes.ts";
import { invalidField, notAnObject, parseListField } from "./json.ts";
import { parseReportedFinding } from "./lens-reports.ts";
import type { ReportedFinding } from "./lens-reports.ts";
import { listOfWords, singularOrPlural } from "./sentences.ts";

export const verdictStatuses = ["confirmed", "refuted", "duplicate"] as const;

export interface VerifiedFinding extends ReportedFinding {
  status: (typeof verdictStatuses)[number];
  /** The id of the confirmed finding that a duplicate repeats, or an empty string. */
  duplicateOf: string;
  evidence: string;
}

/** Reads the result of each job from the needs context of the workflow. */
export function parseJobResults(
  value: unknown,
  source: string,
): Result<Record<string, string>, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  if (Object.keys(value).length === 0) {
    return fail(`${source} names no jobs, so the panel cannot be judged.`);
  }
  const results: Record<string, string> = {};
  for (const [job, details] of Object.entries(value)) {
    const result = isRecord(details) ? details["result"] : undefined;
    if (typeof result !== "string") {
      return invalidField(`${source}: job ${job}`, "result");
    }
    results[job] = result;
  }
  return succeed(results);
}

export function parseVerifiedFindings(
  value: unknown,
  source: string,
): Result<VerifiedFinding[], string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  return parseListField(value, source, {
    field: "findings",
    itemName: "finding",
    parseItem: parseVerifiedFinding,
  });
}

function parseVerifiedFinding(
  value: unknown,
  source: string,
): Result<VerifiedFinding, string> {
  const finding = parseReportedFinding(value, source);
  if (!finding.ok) {
    return finding;
  }
  const verdict = parseVerdict(value, source);
  if (!verdict.ok) {
    return verdict;
  }
  return succeed({ ...finding.value, ...verdict.value });
}

function parseVerdict(
  value: unknown,
  source: string,
): Result<
  Pick<VerifiedFinding, "status" | "duplicateOf" | "evidence">,
  string
> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { status, duplicateOf, evidence } = value;
  const knownStatus = verdictStatuses.find((candidate) => candidate === status);
  if (knownStatus === undefined) {
    return invalidField(source, "status");
  }
  if (typeof duplicateOf !== "string") {
    return invalidField(source, "duplicateOf");
  }
  if (typeof evidence !== "string") {
    return invalidField(source, "evidence");
  }
  return succeed({ status: knownStatus, duplicateOf, evidence });
}

/** Reads the number of the pull request that the review is posted on. */
export function parsePullRequestNumber(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[1-9]\d*$/.test(value)
    ? succeed(value)
    : fail(
        `${source} must be a pull request number, but it is "${String(value)}".`,
      );
}

/** Reads a list of lens names, such as the lenses that the route job chose. */
export function parseLensNames(
  value: unknown,
  source: string,
): Result<string[], string> {
  return isStringArray(value)
    ? succeed(value)
    : fail(`${source} must be a JSON list of lens names.`);
}

/** Reads the lenses from the router's answer. */
export function parseRouterChoice(
  value: unknown,
  source: string,
): Result<string[], string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { lenses } = value;
  return isStringArray(lenses)
    ? succeed(lenses)
    : invalidField(source, "lenses");
}

/** Whether any job of the panel was cancelled, in which case the run reviewed nothing. */
export function hasCancelledJob(jobResults: Record<string, string>): boolean {
  return Object.values(jobResults).includes("cancelled");
}

// AGENTS.md says that these lenses review every change.
const lensesForEveryChange = ["consistency", "standards"];

/** Adds the lenses for every change to the lenses that the router chose, after checking that each one exists. */
export function chooseLenses(
  chosenLenses: readonly string[],
  knownLenses: readonly string[],
): Result<string[], string> {
  const unknown = chosenLenses.filter((lens) => !knownLenses.includes(lens));
  if (unknown.length > 0) {
    return fail(
      `The router chose ${singularOrPlural(unknown.length, "an unknown lens", "unknown lenses")}: ${listOfWords(unknown)}.`,
    );
  }
  return succeed(
    [...new Set([...chosenLenses, ...lensesForEveryChange])].sort(),
  );
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
        `${source} must list its tools on one line that starts with "tools: ", separated by commas.`,
      );
}

/** Reads the name of one lens, which must be a lens that the router's schema names. */
export function parseLensName(
  value: unknown,
  source: string,
  knownLenses: readonly string[],
): Result<string, string> {
  return typeof value === "string" && knownLenses.includes(value)
    ? succeed(value)
    : fail(
        `${source} must be one of ${listOfWords(knownLenses, "disjunction")}, but it is "${String(value)}".`,
      );
}
