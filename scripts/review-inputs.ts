import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { invalidField, isRecord, isStringArray, notAnObject } from "./json.ts";
import { listOfWords } from "./sentences.ts";

export const verdictStatuses = ["confirmed", "refuted", "duplicate"] as const;

interface ReportedFinding {
  id: string;
  lens: string;
  location: string;
  claim: string;
  basis: string;
  siblings: string[];
  rootCause: string;
}

interface CandidateStandard {
  standard: string;
  incident: string;
}

export interface LensReport {
  lens: string;
  findings: ReportedFinding[];
  candidateStandards: CandidateStandard[];
}

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

export function parseLensReport(
  value: unknown,
  source: string,
): Result<LensReport, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { lens, findings, candidateStandards } = value;
  if (typeof lens !== "string") {
    return invalidField(source, "lens");
  }
  if (!Array.isArray(findings)) {
    return invalidField(source, "findings");
  }
  if (!Array.isArray(candidateStandards)) {
    return invalidField(source, "candidateStandards");
  }
  const parsedFindings: ReportedFinding[] = [];
  for (const [index, item] of findings.entries()) {
    const finding = readReportedFinding(
      item,
      `${source}: finding ${String(index + 1)}`,
    );
    if (!finding.ok) {
      return finding;
    }
    parsedFindings.push(finding.value);
  }
  const parsedCandidates: CandidateStandard[] = [];
  for (const [index, item] of candidateStandards.entries()) {
    const candidate = readCandidateStandard(
      item,
      `${source}: candidate standard ${String(index + 1)}`,
    );
    if (!candidate.ok) {
      return candidate;
    }
    parsedCandidates.push(candidate.value);
  }
  return succeed({
    lens,
    findings: parsedFindings,
    candidateStandards: parsedCandidates,
  });
}

export function parseVerifiedFindings(
  value: unknown,
  source: string,
): Result<VerifiedFinding[], string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { findings } = value;
  if (!Array.isArray(findings)) {
    return invalidField(source, "findings");
  }
  const verifiedFindings: VerifiedFinding[] = [];
  for (const [index, item] of findings.entries()) {
    const findingSource = `${source}: finding ${String(index + 1)}`;
    const finding = readReportedFinding(item, findingSource);
    if (!finding.ok) {
      return finding;
    }
    const verdict = readVerdict(item, findingSource);
    if (!verdict.ok) {
      return verdict;
    }
    verifiedFindings.push({ ...finding.value, ...verdict.value });
  }
  return succeed(verifiedFindings);
}

function readReportedFinding(
  value: unknown,
  source: string,
): Result<ReportedFinding, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { id, lens, location, claim, basis, siblings, rootCause } = value;
  if (typeof id !== "string") {
    return invalidField(source, "id");
  }
  if (typeof lens !== "string") {
    return invalidField(source, "lens");
  }
  if (typeof location !== "string") {
    return invalidField(source, "location");
  }
  if (typeof claim !== "string") {
    return invalidField(source, "claim");
  }
  if (typeof basis !== "string") {
    return invalidField(source, "basis");
  }
  if (!isStringArray(siblings)) {
    return invalidField(source, "siblings");
  }
  if (typeof rootCause !== "string") {
    return invalidField(source, "rootCause");
  }
  return succeed({ id, lens, location, claim, basis, siblings, rootCause });
}

function readVerdict(
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

function readCandidateStandard(
  value: unknown,
  source: string,
): Result<CandidateStandard, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { standard, incident } = value;
  if (typeof standard !== "string") {
    return invalidField(source, "standard");
  }
  if (typeof incident !== "string") {
    return invalidField(source, "incident");
  }
  return succeed({ standard, incident });
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
      unknown.length === 1
        ? `The router chose an unknown lens: ${listOfWords(unknown)}.`
        : `The router chose unknown lenses: ${listOfWords(unknown)}.`,
    );
  }
  return succeed(
    [...new Set([...chosenLenses, ...lensesForEveryChange])].sort(),
  );
}

/** Reads the names of the lenses from the schema of the router's answer. */
export function parseRouteSchemaLenses(
  value: unknown,
  source: string,
): Result<string[], string> {
  const properties = isRecord(value) ? value["properties"] : undefined;
  const lenses = isRecord(properties) ? properties["lenses"] : undefined;
  const items = isRecord(lenses) ? lenses["items"] : undefined;
  const names = isRecord(items) ? items["enum"] : undefined;
  return isStringArray(names) && names.length > 0
    ? succeed(names)
    : fail(
        `${source} has no list of lens names at properties.lenses.items.enum.`,
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
