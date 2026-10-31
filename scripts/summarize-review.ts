import type { LensReport } from "./lens-reports.ts";
import type { VerifiedFinding } from "./review-inputs.ts";
import { countOf, listOfWords, singularOrPlural } from "../app/sentences.ts";

export interface ReviewInput {
  /** The result of each job of the panel, such as "success" or "failure". */
  jobResults: Record<string, string>;
  /** The lenses that the router chose, each of which must have reported. */
  expectedLenses: string[];
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
    return `The ${listOfWords(unfinishedJobs)} ${singularOrPlural(unfinishedJobs.length, "job", "jobs")} of the panel did not finish, so this change has not been reviewed.`;
  }
  // Each input problem is a whole sentence, so all of them reach the review and the log of the run.
  if (input.inputProblems.length > 0) {
    return input.inputProblems.join(" ");
  }
  // A missing input is a failure, never an empty one, because a silent failure to download it would otherwise pass the gate.
  const silentLenses = input.expectedLenses.filter(
    (lens) => !input.reports.some((report) => report.lens === lens),
  );
  if (silentLenses.length > 0) {
    return `The panel has no report from the ${listOfWords(silentLenses)} ${singularOrPlural(silentLenses.length, "lens", "lenses")}.`;
  }
  if (input.verifiedFindings === undefined) {
    return "The verifier's output is missing, so no finding has been verified.";
  }
  const coverage = coverageProblem(input.reports, input.verifiedFindings);
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
    const orphanIds = orphans.map((finding) => finding.id);
    return `A duplicate must repeat a confirmed finding, but ${listOfWords(orphanIds)} ${singularOrPlural(orphans.length, "repeats", "repeat")} none.`;
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
  const confirmedCount = verifiedFindings.filter(
    (finding) => finding.status === "confirmed",
  ).length;
  const lines: string[] = [];
  if (refutedCount > 0) {
    lines.push(
      `The verifier refuted ${countOf(refutedCount, "finding", "findings")}.`,
    );
  }
  if (duplicateCount > 0) {
    lines.push(
      `The verifier merged ${countOf(duplicateCount, "duplicate finding", "duplicate findings")} into ${singularOrPlural(confirmedCount, "the finding", "the findings")} above.`,
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

function listOrNone(ids: string[]): string {
  return ids.length > 0 ? ids.join(", ") : "none";
}
