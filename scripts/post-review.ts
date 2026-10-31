import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The review workflow runs this script last. It posts the panel's one review and fails the job unless every part of the panel finished and no verified finding remains.

interface Finding {
  lens: string;
  location: string;
  claim: string;
  basis: string;
  siblings: string[];
  rootCause: string;
}

interface VerifiedFinding extends Finding {
  status: "confirmed" | "refuted";
  evidence: string;
}

interface LensReport {
  lens: string;
  findings: Finding[];
  candidateStandards: { standard: string; incident: string }[];
}

const pullRequest = process.env["PULL_REQUEST"] ?? "";
const panelResults = JSON.parse(process.env["PANEL_RESULTS"] ?? "{}") as Record<
  string,
  { result: string }
>;

const unfinishedJobs = Object.entries(panelResults)
  .filter(([, job]) => job.result !== "success")
  .map(([name]) => name);
const reports = readLensReports("review/findings");
const verifiedFindings = readVerifiedFindings("review/verified.json");
const confirmed = verifiedFindings.filter(
  (finding) => finding.status === "confirmed",
);
const refutedCount = verifiedFindings.length - confirmed.length;

const body = [
  "## Review panel",
  "",
  verdictLine(),
  "",
  `Lenses that ran: ${reports.map((report) => report.lens).join(", ") || "none"}.`,
  ...confirmedSection(),
  ...(refutedCount > 0
    ? ["", `The verifier refuted ${String(refutedCount)} findings.`]
    : []),
  ...candidateSection(),
].join("\n");

const bodyPath = join(tmpdir(), "review-body.md");
writeFileSync(bodyPath, `${body}\n`);
execFileSync(
  "gh",
  ["pr", "review", pullRequest, "--comment", "--body-file", bodyPath],
  { stdio: "inherit" },
);

if (unfinishedJobs.length > 0 || confirmed.length > 0) {
  process.exit(1);
}

function verdictLine(): string {
  if (unfinishedJobs.length > 0) {
    return `**Failed.** The panel did not finish, so this change has not been reviewed. Unfinished jobs: ${unfinishedJobs.join(", ")}.`;
  }
  if (confirmed.length > 0) {
    return `**Failed.** ${String(confirmed.length)} verified findings remain.`;
  }
  return "**Passed.** No verified finding remains.";
}

function confirmedSection(): string[] {
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

function candidateSection(): string[] {
  const lines: string[] = [];
  for (const report of reports) {
    for (const candidate of report.candidateStandards) {
      lines.push(
        `- ${candidate.standard} (${report.lens}, because ${candidate.incident})`,
      );
    }
  }
  return lines.length > 0 ? ["", "### Candidate standards", "", ...lines] : [];
}

function readLensReports(directory: string): LensReport[] {
  if (!existsSync(directory)) {
    return [];
  }
  const reports: LensReport[] = [];
  for (const file of readdirSync(directory).sort()) {
    reports.push(
      JSON.parse(readFileSync(join(directory, file), "utf8")) as LensReport,
    );
  }
  return reports;
}

function readVerifiedFindings(path: string): VerifiedFinding[] {
  if (!existsSync(path)) {
    return [];
  }
  const verified = JSON.parse(readFileSync(path, "utf8")) as {
    findings: VerifiedFinding[];
  };
  return verified.findings;
}
