import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isStringArray, parseJsonText, readJsonFile } from "./json.ts";
import {
  parseJobResults,
  parseLensReport,
  parseVerifiedFindings,
  summarizeReview,
} from "./review-summary.ts";
import type { LensReport, VerifiedFinding } from "./review-summary.ts";

const pullRequest = process.env["PULL_REQUEST"] ?? "";
if (!/^[1-9]\d*$/.test(pullRequest)) {
  failWithoutReview(
    `PULL_REQUEST must be a pull request number, but it is "${pullRequest}".`,
  );
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
if (Object.values(jobResults.value).includes("cancelled")) {
  failWithoutReview(
    "The panel was cancelled before it finished, so this run reviewed nothing.",
  );
}

const inputProblems: string[] = [];
const expectedLenses = parseJsonText(
  process.env["EXPECTED_LENSES"] ?? "",
  "EXPECTED_LENSES",
);
if (!expectedLenses.ok || !isStringArray(expectedLenses.value)) {
  inputProblems.push("EXPECTED_LENSES must be the JSON list of lenses.");
}
const reports: LensReport[] = [];
const findingsDirectory = "review/findings";
for (const file of existsSync(findingsDirectory)
  ? readdirSync(findingsDirectory).sort()
  : []) {
  const json = readJsonFile(join(findingsDirectory, file));
  const report = json.ok ? parseLensReport(json.value) : json;
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
  const verified = json.ok ? parseVerifiedFindings(json.value) : json;
  if (verified.ok) {
    verifiedFindings = verified.value;
  } else {
    inputProblems.push(verified.failure);
  }
}

const outcome = summarizeReview({
  jobResults: jobResults.value,
  expectedLenses:
    expectedLenses.ok && isStringArray(expectedLenses.value)
      ? expectedLenses.value
      : [],
  reports,
  verifiedFindings,
  inputProblems,
});
const bodyPath = join(tmpdir(), "review-body.md");
writeFileSync(bodyPath, `${outcome.body}\n`);
execFileSync(
  "gh",
  ["pr", "review", pullRequest, "--comment", "--body-file", bodyPath],
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
