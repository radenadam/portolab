import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray } from "./json.ts";

const verdictStatuses = ["confirmed", "refuted", "duplicate"] as const;

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

/** Reads the result of each job from the JSON of the workflow's needs context. */
export function parseJobResults(
  value: unknown,
): Result<Record<string, string>, string> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return fail("PANEL_RESULTS names no jobs, so the panel cannot be judged.");
  }
  const results: Record<string, string> = {};
  for (const [job, details] of Object.entries(value)) {
    const result = isRecord(details) ? details["result"] : undefined;
    results[job] = typeof result === "string" ? result : "unknown";
  }
  return succeed(results);
}

export function parseLensReport(
  value: unknown,
  source: string,
): Result<LensReport, string> {
  if (!isRecord(value)) {
    return fail(`${source} is not a JSON object.`);
  }
  const { lens, findings, candidateStandards } = value;
  if (typeof lens !== "string") {
    return fail(`${source} has no valid "lens".`);
  }
  if (!Array.isArray(findings)) {
    return fail(`${source} has no valid "findings".`);
  }
  if (!Array.isArray(candidateStandards)) {
    return fail(`${source} has no valid "candidateStandards".`);
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
  if (!isRecord(value) || !Array.isArray(value["findings"])) {
    return fail(`${source} has no valid "findings".`);
  }
  const verifiedFindings: VerifiedFinding[] = [];
  for (const [index, item] of value["findings"].entries()) {
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

const findingTextFields = [
  "id",
  "lens",
  "location",
  "claim",
  "basis",
  "rootCause",
] as const;

/** Returns the name of the first field that is missing or has the wrong type. */
function invalidFindingField(
  value: Record<string, unknown>,
): string | undefined {
  const textField = findingTextFields.find(
    (field) => typeof value[field] !== "string",
  );
  if (textField !== undefined) {
    return textField;
  }
  return isStringArray(value["siblings"]) ? undefined : "siblings";
}

function isReportedFinding(
  value: Record<string, unknown>,
): value is Record<string, unknown> & ReportedFinding {
  return invalidFindingField(value) === undefined;
}

function readReportedFinding(
  value: unknown,
  source: string,
): Result<ReportedFinding, string> {
  if (!isRecord(value)) {
    return fail(`${source} is not a JSON object.`);
  }
  if (!isReportedFinding(value)) {
    return fail(
      `${source} has no valid "${String(invalidFindingField(value))}".`,
    );
  }
  const { id, lens, location, claim, basis, siblings, rootCause } = value;
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
    return fail(`${source} is not a JSON object.`);
  }
  const { status, duplicateOf, evidence } = value;
  const knownStatus = verdictStatuses.find((candidate) => candidate === status);
  if (knownStatus === undefined) {
    return fail(`${source} has no valid "status".`);
  }
  if (typeof duplicateOf !== "string") {
    return fail(`${source} has no valid "duplicateOf".`);
  }
  if (typeof evidence !== "string") {
    return fail(`${source} has no valid "evidence".`);
  }
  return succeed({ status: knownStatus, duplicateOf, evidence });
}

function readCandidateStandard(
  value: unknown,
  source: string,
): Result<CandidateStandard, string> {
  if (!isRecord(value)) {
    return fail(`${source} is not a JSON object.`);
  }
  const { standard, incident } = value;
  if (typeof standard !== "string") {
    return fail(`${source} has no valid "standard".`);
  }
  if (typeof incident !== "string") {
    return fail(`${source} has no valid "incident".`);
  }
  return succeed({ standard, incident });
}
