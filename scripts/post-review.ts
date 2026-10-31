import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { failuresOf } from "../app/result.ts";
import { exitWithFailure } from "./exit-with-failure.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import {
  hasCancelledJob,
  parseJobResults,
  parseLensNames,
  parseLensReport,
  parsePullRequestNumber,
  parseVerifiedFindings,
} from "./review-inputs.ts";
import type { LensReport, VerifiedFinding } from "./review-inputs.ts";
import { summarizeReview } from "./summarize-review.ts";

const pullRequest = parsePullRequestNumber(
  process.env["PULL_REQUEST"],
  "PULL_REQUEST",
);
const jobResults = parseJsonWith(
  process.env["PANEL_RESULTS"],
  "PANEL_RESULTS",
  parseJobResults,
);
if (!pullRequest.ok || !jobResults.ok) {
  exitWithFailure(failuresOf([pullRequest, jobResults]));
}
// A cancelled run reviewed nothing, so it fails without posting a review. When a newer push cancelled it, the newer run posts the review.
if (hasCancelledJob(jobResults.value)) {
  exitWithFailure([
    "The panel was cancelled before it finished, so this run reviewed nothing.",
  ]);
}

const inputProblems: string[] = [];
const expectedLenses = parseJsonWith(
  process.env["EXPECTED_LENSES"],
  "EXPECTED_LENSES",
  parseLensNames,
);
if (!expectedLenses.ok) {
  inputProblems.push(expectedLenses.failure);
}

const reports: LensReport[] = [];
const findingsDirectory = "review/findings";
for (const file of existsSync(findingsDirectory)
  ? readdirSync(findingsDirectory).sort()
  : []) {
  const report = readJsonFile(join(findingsDirectory, file), parseLensReport);
  if (report.ok) {
    reports.push(report.value);
  } else {
    inputProblems.push(report.failure);
  }
}
let verifiedFindings: VerifiedFinding[] | undefined;
const verifiedPath = "review/verified.json";
if (existsSync(verifiedPath)) {
  const verified = readJsonFile(verifiedPath, parseVerifiedFindings);
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
  exitWithFailure([outcome.verdict]);
}
