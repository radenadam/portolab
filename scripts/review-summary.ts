import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

// These lists must equal the `required` lists in .github/review/, and a test compares them.
export const lensFindingFields = [
  "location",
  "claim",
  "basis",
  "siblings",
  "rootCause",
] as const;
export const verifiedFindingFields = [
  "lens",
  ...lensFindingFields,
  "status",
  "evidence",
] as const;

const verifiedStatuses = ["confirmed", "refuted", "duplicate"] as const;

interface Finding {
  location: string;
  claim: string;
  basis: string;
  siblings: string[];
  rootCause: string;
}

export interface LensReport {
  lens: string;
  findings: Finding[];
  candidateStandards: { standard: string; incident: string }[];
}

export interface VerifiedFinding extends Finding {
  lens: string;
  status: (typeof verifiedStatuses)[number];
  evidence: string;
}

export interface ReviewInput {
  /** The result of each job of the panel, such as "success" or "failure". */
  jobResults: Record<string, string>;
  reports: LensReport[];
  verifiedFindings: VerifiedFinding[] | undefined;
  /** Inputs that could not be read, each as one sentence. */
  inputProblems: string[];
}

export interface ReviewOutcome {
  passed: boolean;
  /** One sentence that says why the review passed or failed. */
  verdict: string;
  body: string;
}

export function summarizeReview(input: ReviewInput): ReviewOutcome {
  const confirmed = (input.verifiedFindings ?? []).filter(
    (finding) => finding.status === "confirmed",
  );
  const verdict = verdictSentence(input, confirmed.length);
  const passed = verdict === passedVerdict;
  const lenses = input.reports.map((report) => report.lens).join(", ");
  const body = [
    "## Review panel",
    "",
    `**${passed ? "Passed" : "Failed"}.** ${verdict}`,
    "",
    `Lenses that ran: ${lenses === "" ? "none" : lenses}.`,
    ...confirmedSection(confirmed),
    ...dismissedSection(input.verifiedFindings ?? []),
    ...candidateSection(input.reports),
  ].join("\n");
  return { passed, verdict, body };
}

const passedVerdict = "No verified finding remains.";

function verdictSentence(input: ReviewInput, confirmedCount: number): string {
  const unfinishedJobs = Object.entries(input.jobResults)
    .filter(([, result]) => result !== "success")
    .map(([job]) => job);
  if (unfinishedJobs.length > 0) {
    return `The panel did not finish, so this change has not been reviewed. Unfinished jobs: ${unfinishedJobs.join(", ")}.`;
  }
  const [inputProblem] = input.inputProblems;
  if (inputProblem !== undefined) {
    return inputProblem;
  }
  const reportedCount = countFindings(input.reports);
  const verifiedCount = input.verifiedFindings?.length ?? 0;
  if (verifiedCount !== reportedCount) {
    return `The lenses reported ${countOf(reportedCount, "finding", "findings")}, but the verifier returned ${String(verifiedCount)}, so some findings were never verified.`;
  }
  if (confirmedCount > 0) {
    return `${countOf(confirmedCount, "verified finding remains", "verified findings remain")}.`;
  }
  return passedVerdict;
}

function confirmedSection(confirmed: VerifiedFinding[]): string[] {
  if (confirmed.length === 0) {
    return [];
  }
  const lines = ["", "### Verified findings"];
  for (const [index, finding] of confirmed.entries()) {
    lines.push(
      "",
      `${String(index + 1)}. \`${finding.location}\` (${finding.lens}): ${finding.claim}`,
      `   - Basis: ${finding.basis}`,
      `   - Evidence: ${finding.evidence}`,
    );
    if (finding.siblings.length > 0) {
      lines.push(`   - Siblings: ${finding.siblings.join(", ")}`);
    }
    if (finding.rootCause !== "") {
      lines.push(`   - Root cause: ${finding.rootCause}`);
    }
  }
  return lines;
}

function dismissedSection(verifiedFindings: VerifiedFinding[]): string[] {
  const refutedCount = verifiedFindings.filter(
    (finding) => finding.status === "refuted",
  ).length;
  const duplicateCount = verifiedFindings.filter(
    (finding) => finding.status === "duplicate",
  ).length;
  const lines: string[] = [];
  if (refutedCount > 0) {
    lines.push(
      `The verifier refuted ${countOf(refutedCount, "finding", "findings")}.`,
    );
  }
  if (duplicateCount > 0) {
    lines.push(
      `The verifier merged ${countOf(duplicateCount, "duplicate finding", "duplicate findings")} into the findings above.`,
    );
  }
  return lines.length > 0 ? ["", ...lines] : [];
}

function candidateSection(reports: LensReport[]): string[] {
  const lines: string[] = [];
  for (const report of reports) {
    for (const candidate of report.candidateStandards) {
      lines.push(
        `- ${candidate.standard} Suggested by the ${report.lens} lens, because of this incident: ${candidate.incident}`,
      );
    }
  }
  return lines.length > 0 ? ["", "### Candidate standards", "", ...lines] : [];
}

function countFindings(reports: LensReport[]): number {
  let count = 0;
  for (const report of reports) {
    count += report.findings.length;
  }
  return count;
}

function countOf(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

export function parseLensReport(value: unknown): Result<LensReport, string> {
  if (
    !isRecord(value) ||
    typeof value["lens"] !== "string" ||
    !Array.isArray(value["findings"]) ||
    !Array.isArray(value["candidateStandards"])
  ) {
    return fail(
      "A lens report lacks its lens, findings, or candidate standards.",
    );
  }
  const findings: Finding[] = [];
  for (const finding of value["findings"]) {
    if (!isFinding(finding)) {
      return fail(
        `The ${value["lens"]} lens returned a finding with missing fields.`,
      );
    }
    findings.push(finding);
  }
  const candidateStandards: LensReport["candidateStandards"] = [];
  for (const candidate of value["candidateStandards"]) {
    if (
      !isRecord(candidate) ||
      typeof candidate["standard"] !== "string" ||
      typeof candidate["incident"] !== "string"
    ) {
      return fail(
        `The ${value["lens"]} lens returned a malformed candidate standard.`,
      );
    }
    candidateStandards.push({
      standard: candidate["standard"],
      incident: candidate["incident"],
    });
  }
  return succeed({ lens: value["lens"], findings, candidateStandards });
}

export function parseVerifiedFindings(
  value: unknown,
): Result<VerifiedFinding[], string> {
  if (!isRecord(value) || !Array.isArray(value["findings"])) {
    return fail("The verifier's output lacks its list of findings.");
  }
  const verifiedFindings: VerifiedFinding[] = [];
  for (const finding of value["findings"]) {
    const status = verifiedStatuses.find(
      (candidate) => isRecord(finding) && candidate === finding["status"],
    );
    if (
      !isFinding(finding) ||
      typeof finding["lens"] !== "string" ||
      typeof finding["evidence"] !== "string" ||
      status === undefined
    ) {
      return fail("The verifier returned a finding with missing fields.");
    }
    verifiedFindings.push({
      lens: finding["lens"],
      location: finding.location,
      claim: finding.claim,
      basis: finding.basis,
      siblings: finding.siblings,
      rootCause: finding.rootCause,
      status,
      evidence: finding["evidence"],
    });
  }
  return succeed(verifiedFindings);
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

function isFinding(value: unknown): value is Finding & Record<string, unknown> {
  return (
    isRecord(value) &&
    typeof value["location"] === "string" &&
    typeof value["claim"] === "string" &&
    typeof value["basis"] === "string" &&
    typeof value["rootCause"] === "string" &&
    Array.isArray(value["siblings"]) &&
    value["siblings"].every((sibling) => typeof sibling === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
