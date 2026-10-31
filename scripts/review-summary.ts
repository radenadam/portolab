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

const passedVerdict = "No verified finding remains.";

export function summarizeReview(input: ReviewInput): ReviewOutcome {
  const verifiedFindings = input.verifiedFindings ?? [];
  const confirmed = verifiedFindings.filter(
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
    ...dismissedSection(verifiedFindings),
    ...candidateSection(input.reports),
  ].join("\n");
  return { passed, verdict, body };
}

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
  const coverage = coverageProblem(input.reports, input.verifiedFindings ?? []);
  if (coverage !== undefined) {
    return coverage;
  }
  if (confirmedCount > 0) {
    return `${countOf(confirmedCount, "verified finding remains", "verified findings remain")}.`;
  }
  return passedVerdict;
}

/** Returns a sentence when the verifier did not give exactly one verdict for each reported finding, or when a duplicate points at no confirmed finding. */
function coverageProblem(
  reports: LensReport[],
  verifiedFindings: VerifiedFinding[],
): string | undefined {
  const reportedIds = new Set<string>();
  for (const report of reports) {
    for (const finding of report.findings) {
      reportedIds.add(finding.id);
    }
  }
  const verdictIds = verifiedFindings.map((finding) => finding.id);
  const missing = [...reportedIds].filter((id) => !verdictIds.includes(id));
  const unknown = verdictIds.filter((id) => !reportedIds.has(id));
  const repeated = verdictIds.filter(
    (id, index) => verdictIds.indexOf(id) !== index,
  );
  if (missing.length > 0 || unknown.length > 0 || repeated.length > 0) {
    return `The verifier must give exactly one verdict for each reported finding, so its answer cannot be trusted. Missing: ${listOrNone(missing)}. Unknown: ${listOrNone(unknown)}. Repeated: ${listOrNone(repeated)}.`;
  }
  const confirmedIds = new Set(
    verifiedFindings
      .filter((finding) => finding.status === "confirmed")
      .map((finding) => finding.id),
  );
  const orphans = verifiedFindings.filter(
    (finding) =>
      finding.status === "duplicate" && !confirmedIds.has(finding.duplicateOf),
  );
  if (orphans.length > 0) {
    return `A duplicate must repeat a confirmed finding, but ${orphans.map((finding) => finding.id).join(", ")} does not.`;
  }
  return undefined;
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

function countOf(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

function listOrNone(ids: string[]): string {
  return ids.length > 0 ? ids.join(", ") : "none";
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
  const lens = value["lens"];
  const findings: ReportedFinding[] = [];
  for (const item of value["findings"]) {
    const finding = readReportedFinding(item);
    if (finding === undefined) {
      return fail(`The ${lens} lens returned a finding with missing fields.`);
    }
    findings.push(finding);
  }
  const candidateStandards: CandidateStandard[] = [];
  for (const item of value["candidateStandards"]) {
    if (
      !isRecord(item) ||
      typeof item["standard"] !== "string" ||
      typeof item["incident"] !== "string"
    ) {
      return fail(`The ${lens} lens returned a malformed candidate standard.`);
    }
    candidateStandards.push({
      standard: item["standard"],
      incident: item["incident"],
    });
  }
  return succeed({ lens, findings, candidateStandards });
}

export function parseVerifiedFindings(
  value: unknown,
): Result<VerifiedFinding[], string> {
  if (!isRecord(value) || !Array.isArray(value["findings"])) {
    return fail("The verifier's output lacks its list of findings.");
  }
  const verifiedFindings: VerifiedFinding[] = [];
  for (const item of value["findings"]) {
    const finding = readReportedFinding(item);
    const status = verdictStatuses.find(
      (candidate) => isRecord(item) && candidate === item["status"],
    );
    if (
      finding === undefined ||
      !isRecord(item) ||
      status === undefined ||
      typeof item["duplicateOf"] !== "string" ||
      typeof item["evidence"] !== "string"
    ) {
      return fail("The verifier returned a finding with missing fields.");
    }
    verifiedFindings.push({
      ...finding,
      status,
      duplicateOf: item["duplicateOf"],
      evidence: item["evidence"],
    });
  }
  return succeed(verifiedFindings);
}

function readReportedFinding(value: unknown): ReportedFinding | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const { id, lens, location, claim, basis, siblings, rootCause } = value;
  if (
    typeof id !== "string" ||
    typeof lens !== "string" ||
    typeof location !== "string" ||
    typeof claim !== "string" ||
    typeof basis !== "string" ||
    !isStringArray(siblings) ||
    typeof rootCause !== "string"
  ) {
    return undefined;
  }
  return { id, lens, location, claim, basis, siblings, rootCause };
}
