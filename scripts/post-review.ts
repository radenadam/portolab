import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseJobResults,
  parseLensReport,
  parseVerifiedFindings,
  summarizeReview,
} from "./review-summary.ts";
import type { LensReport, VerifiedFinding } from "./review-summary.ts";

const inputProblems: string[] = [];

const pullRequest = process.env["PULL_REQUEST"] ?? "";
if (!/^[1-9]\d*$/.test(pullRequest)) {
  failWithoutReview(
    `PULL_REQUEST must be a pull request number, but it is "${pullRequest}".`,
  );
}
const jobResults = readJobResults(process.env["PANEL_RESULTS"]);
const reports = readLensReports("review/findings");
const verifiedFindings = readVerifiedFindings("review/verified.json");

const outcome = summarizeReview({
  jobResults,
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

function readJobResults(value: string | undefined): Record<string, string> {
  const results = parseJobResults(parseJson(value ?? "", "PANEL_RESULTS"));
  if (!results.ok) {
    failWithoutReview(results.failure);
  }
  return results.value;
}

function readLensReports(directory: string): LensReport[] {
  if (!existsSync(directory)) {
    return [];
  }
  const reports: LensReport[] = [];
  for (const file of readdirSync(directory).sort()) {
    const report = parseLensReport(
      parseJson(readFileSync(join(directory, file), "utf8"), file),
    );
    if (report.ok) {
      reports.push(report.value);
    } else {
      inputProblems.push(report.failure);
    }
  }
  return reports;
}

function readVerifiedFindings(path: string): VerifiedFinding[] | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  const verified = parseVerifiedFindings(
    parseJson(readFileSync(path, "utf8"), "verified.json"),
  );
  if (!verified.ok) {
    inputProblems.push(verified.failure);
    return undefined;
  }
  return verified.value;
}

function parseJson(text: string, source: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    inputProblems.push(`${source} is not valid JSON.`);
    return undefined;
  }
}

function failWithoutReview(reason: string): never {
  process.stderr.write(`::error::${reason}\n`);
  process.exit(1);
}
