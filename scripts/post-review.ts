import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { errorMessage } from "../app/error-message.ts";
import { fail, failuresOf } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import { readLensReports } from "./lens-reports.ts";
import {
  parseCommitHash,
  parseJobResults,
  parseLensNames,
  parsePullRequestNumber,
  parseVerifiedFindings,
  supersededRun,
} from "./review-inputs.ts";
import type { VerifiedFinding } from "./review-inputs.ts";
import { summarizeReview } from "./summarize-review.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Every input is parsed before the script stops, so the log names every problem at once.
const pullRequest = parsePullRequestNumber(
  process.env["PULL_REQUEST"],
  "PULL_REQUEST",
);
const reviewedHead = parseCommitHash(
  process.env["REVIEWED_HEAD"],
  "REVIEWED_HEAD",
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
// Without the pull request, its reviewed head, or the results of the jobs, no review can be posted.
if (!pullRequest.ok || !reviewedHead.ok || !jobResults.ok) {
  exitWithFailure(
    [...failuresOf([pullRequest, reviewedHead, jobResults]), ...inputProblems],
    writeScriptFailure,
  );
}
const currentHead = readCurrentHead(pullRequest.value);
if (!currentHead.ok) {
  exitWithFailure([currentHead.failure], writeScriptFailure);
}
const superseded = supersededRun(
  jobResults.value,
  reviewedHead.value,
  currentHead.value,
);
if (superseded !== undefined) {
  exitWithFailure([superseded], writeScriptFailure);
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

/** Reads the head of the pull request as it is now, which differs from the reviewed head after a newer push. */
function readCurrentHead(pullRequestNumber: string): Result<string, string> {
  try {
    const head = execFileSync(
      "gh",
      [
        "pr",
        "view",
        pullRequestNumber,
        "--json",
        "headRefOid",
        "--jq",
        ".headRefOid",
      ],
      { encoding: "utf8" },
    ).trim();
    return parseCommitHash(head, "The head of the pull request from gh");
  } catch (error) {
    return fail(
      `gh could not read the head of pull request ${pullRequestNumber}. It reported: ${errorMessage(error)}`,
    );
  }
}
