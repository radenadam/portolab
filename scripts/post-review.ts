import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import { readLensReports } from "./lens-reports.ts";
import {
  hasCancelledJob,
  parseJobResults,
  parseLensNames,
  parsePullRequestNumber,
  parseVerifiedFindings,
} from "./review-inputs.ts";
import type { VerifiedFinding } from "./review-inputs.ts";
import { summarizeReview } from "./summarize-review.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Every input is parsed before the script stops, so the log names every problem at once.
const pullRequest = parsePullRequestNumber(
  process.env["PULL_REQUEST"],
  "PULL_REQUEST",
);
const jobResults = parseJsonWith(
  process.env["PANEL_RESULTS"],
  "PANEL_RESULTS",
  parseJobResults,
);
const expectedLenses = parseJsonWith(
  process.env["EXPECTED_LENSES"],
  "EXPECTED_LENSES",
  parseLensNames,
);
const { reports, problems: reportProblems } =
  readLensReports("review/findings");
const verifiedPath = "review/verified.json";
const verified = existsSync(verifiedPath)
  ? readJsonFile(verifiedPath, parseVerifiedFindings)
  : undefined;

const inputProblems = [...failuresOf([expectedLenses]), ...reportProblems];
if (verified?.ok === false) {
  inputProblems.push(verified.failure);
}
// Without the pull request or the results of the jobs, no review can be posted.
if (!pullRequest.ok || !jobResults.ok) {
  exitWithFailure(
    [...failuresOf([pullRequest, jobResults]), ...inputProblems],
    writeScriptFailure,
  );
}
// A cancelled run reviewed nothing, so it fails without posting a review. When a newer push cancelled it, the newer run posts the review.
if (hasCancelledJob(jobResults.value)) {
  exitWithFailure(
    [
      "The panel was cancelled before it finished, so this run reviewed nothing.",
    ],
    writeScriptFailure,
  );
}

const verifiedFindings: VerifiedFinding[] | undefined = verified?.ok
  ? verified.value
  : undefined;
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
  exitWithFailure([outcome.verdict], writeScriptFailure);
}
