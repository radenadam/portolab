import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseJsonText, readJsonFile } from "./json.ts";
import {
  hasCancelledJob,
  parseExpectedLenses,
  parseJobResults,
  parseLensReport,
  parsePullRequestNumber,
  parseVerifiedFindings,
} from "./review-inputs.ts";
import type { LensReport, VerifiedFinding } from "./review-inputs.ts";
import { summarizeReview } from "./review-summary.ts";

const pullRequest = parsePullRequestNumber(process.env["PULL_REQUEST"] ?? "");
if (!pullRequest.ok) {
  failWithoutReview(pullRequest.failure);
}
const panelResults = parseJsonText(
  process.env["PANEL_RESULTS"] ?? "",
  "PANEL_RESULTS",
);
if (!panelResults.ok) {
  failWithoutReview(panelResults.failure);
}
const jobResults = parseJobResults(panelResults.value);
if (!jobResults.ok) {
  failWithoutReview(jobResults.failure);
}
// A cancelled run reviewed nothing, so it fails without posting a review. When a newer push cancelled it, the newer run posts the review.
if (hasCancelledJob(jobResults.value)) {
  failWithoutReview(
    "The panel was cancelled before it finished, so this run reviewed nothing.",
  );
}

const inputProblems: string[] = [];
const expectedLenses = parseExpectedLenses(
  process.env["EXPECTED_LENSES"] ?? "",
);
if (!expectedLenses.ok) {
  inputProblems.push(expectedLenses.failure);
}

const reports: LensReport[] = [];
const findingsDirectory = "review/findings";
for (const file of existsSync(findingsDirectory)
  ? readdirSync(findingsDirectory).sort()
  : []) {
  const json = readJsonFile(join(findingsDirectory, file));
  const report = json.ok ? parseLensReport(json.value, file) : json;
  if (report.ok) {
    reports.push(report.value);
  } else {
    inputProblems.push(report.failure);
  }
}
let verifiedFindings: VerifiedFinding[] | undefined;
const verifiedPath = "review/verified.json";
if (existsSync(verifiedPath)) {
  const json = readJsonFile(verifiedPath);
  const verified = json.ok
    ? parseVerifiedFindings(json.value, "verified.json")
    : json;
  if (verified.ok) {
    verifiedFindings = verified.value;
  } else {
    inputProblems.push(verified.failure);
  }
}

const outcome = summarizeReview({
  jobResults: jobResults.value,
  expectedLenses: expectedLenses.ok ? expectedLenses.value : [],
  reports,
  verifiedFindings,
  inputProblems,
});
const bodyPath = join(tmpdir(), "review-body.md");
writeFileSync(bodyPath, `${outcome.body}\n`);
execFileSync(
  "gh",
  ["pr", "review", pullRequest.value, "--comment", "--body-file", bodyPath],
  { stdio: "inherit" },
);
if (!outcome.passed) {
  process.stderr.write(`::error::${outcome.verdict}\n`);
  process.exit(1);
}

function failWithoutReview(reason: string): never {
  process.stderr.write(`::error::${reason}\n`);
  process.exit(1);
}
