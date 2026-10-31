import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import {
  invalidField,
  notAnObject,
  parseListField,
  parseStringField,
  parseStringsAt,
} from "./json.ts";
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
    return notAnObject(source, value);
  }
  if (Object.keys(value).length === 0) {
    return fail(
      `${source} must name at least one job, but it is ${describeValue(value)}.`,
    );
  }
  const results: Record<string, string> = {};
  for (const [job, details] of Object.entries(value)) {
    const result = parseStringField(details, `${source}: job ${job}`, "result");
    if (!result.ok) {
      return result;
    }
    results[job] = result.value;
  }
  return succeed(results);
}

export function parseVerifiedFindings(
  value: unknown,
  source: string,
): Result<VerifiedFinding[], string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
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
  const status = isRecord(value) ? value["status"] : undefined;
  const knownStatus = verdictStatuses.find((candidate) => candidate === status);
  if (knownStatus === undefined) {
    return invalidField(source, {
      field: "status",
      expected: `one of ${listOfWords(verdictStatuses, "disjunction")}`,
      value: status,
    });
  }
  const duplicateOf = parseStringField(value, source, "duplicateOf");
  if (!duplicateOf.ok) {
    return duplicateOf;
  }
  const evidence = parseStringField(value, source, "evidence");
  if (!evidence.ok) {
    return evidence;
  }
  return succeed({
    status: knownStatus,
    duplicateOf: duplicateOf.value,
    evidence: evidence.value,
  });
}

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

/** Reads a list of lens names, such as the lenses that the route job chose. */
export function parseLensNames(
  value: unknown,
  source: string,
): Result<string[], string> {
  // The router's choice always gains the lenses for every change, so the list of expected lenses is never empty.
  return parseStringsAt(value, source, { keys: [], mayBeEmpty: false });
}

/** Reads the lenses from the router's answer. */
export function parseRouterChoice(
  value: unknown,
  source: string,
): Result<string[], string> {
  // The router may choose no lens, because the lenses for every change are added after it.
  return parseStringsAt(value, source, { keys: ["lenses"], mayBeEmpty: true });
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

/** Returns a sentence when a newer push cancelled the panel, so that the newer run posts the review. GitHub also cancels a job that runs out of time, and then the head has not moved, so the review names that job instead. */
export function supersededRun(
  jobResults: Record<string, string>,
  reviewedHead: string,
  currentHead: string,
): string | undefined {
  const wasCancelled = Object.values(jobResults).includes("cancelled");
  return wasCancelled && reviewedHead !== currentHead
    ? `A newer push moved the pull request to ${currentHead} while this run reviewed ${reviewedHead}, so the run for the newer head posts the review.`
    : undefined;
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
        `${source} must list its tools on one line that starts with "tools: ", separated by commas, but that list is ${describeValue(line)}.`,
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
        `${source} must be one of ${listOfWords(knownLenses, "disjunction")}, but it is ${describeValue(value)}.`,
      );
}
