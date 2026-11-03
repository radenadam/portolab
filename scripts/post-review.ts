import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { fail, failuresOf, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeAgentRun, parseAgentRun } from "./agent-run.ts";
import { parseJsonWith, parseOptionalJsonWith } from "./json.ts";
import { parseReviewerReport, parseVerdicts } from "./review-findings.ts";
import {
  parseCommitHash,
  parseJobResults,
  parsePullRequestNumber,
} from "./review-inputs.ts";
import { buildRoundReport, parseReviewPlan } from "./review-plan.ts";
import { stateMarker } from "./review-state.ts";
import { runCommand } from "./run-command.ts";
import {
  oversizeProblem,
  outsideIssue,
  summarizeReview,
  supersededRun,
  unplannedReview,
} from "./summarize-review.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Every input is parsed before the script stops, so the log names every problem at once. Each input is an output of a job, and an agent can change only the outputs of its own job, so each of those is parsed like any output of an agent.
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
if (!pullRequest.ok || !reviewedHead.ok || !jobResults.ok) {
  exitWithFailure(
    failuresOf([pullRequest, reviewedHead, jobResults]),
    writeScriptFailure,
  );
}
if (Object.values(jobResults.value).includes("cancelled")) {
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
}

// A job that did not finish gives an empty output, which stays undefined, and the summary judges whether the plan needed it.
const plan = parseOptionalJsonWith(
  process.env["PLAN"],
  "PLAN",
  parseReviewPlan,
);
if (!plan.ok || plan.value === undefined) {
  const unplanned = unplannedReview(
    jobResults.value["plan"] ?? "missing",
    plan.ok ? undefined : plan.failure,
  );
  postReview(pullRequest.value, unplanned.body);
  exitWithFailure([unplanned.verdict], writeScriptFailure);
}
const reviewerReport = parseOptionalJsonWith(
  process.env["REVIEWER_OUTPUT"],
  "REVIEWER_OUTPUT",
  parseReviewerReport,
);
const verdicts = parseOptionalJsonWith(
  process.env["VERIFIER_OUTPUT"],
  "VERIFIER_OUTPUT",
  parseVerdicts,
);
const reviewerRun = parseOptionalJsonWith(
  process.env["REVIEWER_RUN"],
  "REVIEWER_RUN",
  parseAgentRun,
);
const verifierRun = parseOptionalJsonWith(
  process.env["VERIFIER_RUN"],
  "VERIFIER_RUN",
  parseAgentRun,
);
const inputProblems = failuresOf([
  reviewerReport,
  verdicts,
  reviewerRun,
  verifierRun,
]);
const reviewerAnswer = reviewerReport.ok ? reviewerReport.value : undefined;
// An agent that did not run leaves its measure empty.
const runs: string[] = [];
if (reviewerRun.ok && reviewerRun.value !== undefined) {
  runs.push(describeAgentRun("reviewer", reviewerRun.value));
}
if (verifierRun.ok && verifierRun.value !== undefined) {
  runs.push(describeAgentRun("verifier", verifierRun.value));
}
const outcome = summarizeReview({
  plan: plan.value,
  reviewedHead: reviewedHead.value,
  // A round that checks has a report without a reviewer, but a review round has none until the reviewer answers.
  report:
    plan.value.kind !== "review" || reviewerAnswer !== undefined
      ? buildRoundReport(plan.value, reviewerAnswer)
      : undefined,
  verdicts: verdicts.ok ? verdicts.value : undefined,
  jobResults: jobResults.value,
  runs,
  inputProblems,
});

const failures: string[] = [];
const bodyParts = [outcome.body];
const { outside } = outcome;
if (outside.findings.length > 0 || outside.candidateStandards.length > 0) {
  const issue = outsideIssue(pullRequest.value, outside);
  const created = createIssue(issue.title, issue.body);
  if (created.ok) {
    bodyParts.push(
      "",
      `The issue ${created.value} records what this round found outside the change.`,
    );
  } else {
    failures.push(created.failure);
    bodyParts.push(
      "",
      `gh could not open the issue for what this round found outside the change, so it follows here. Open the issue from it by hand. gh reported: ${created.failure}`,
      "",
      issue.body,
    );
  }
}
if (outcome.state !== undefined) {
  bodyParts.push("", stateMarker(outcome.state));
}
postReview(pullRequest.value, bodyParts.join("\n"));
if (!outcome.passed) {
  failures.push(outcome.verdict);
}
if (failures.length > 0) {
  exitWithFailure(failures, writeScriptFailure);
}

/** Posts the review, or stops with the reason. A review that is too long for GitHub goes to the log instead, so that no finding is lost. */
function postReview(pullRequestNumber: string, body: string): void {
  const tooLong = oversizeProblem("review", body);
  if (tooLong !== undefined) {
    process.stdout.write(`${body}\n`);
    exitWithFailure([tooLong], writeScriptFailure);
  }
  const posted = runCommand(
    "gh",
    ["pr", "review", pullRequestNumber, "--comment", "--body-file", "-"],
    { input: `${body}\n` },
  );
  if (!posted.ok) {
    exitWithFailure(
      [
        `gh could not post the review on pull request ${pullRequestNumber}. ${posted.failure}`,
      ],
      writeScriptFailure,
    );
  }
}

/** Opens an issue and returns its address, as gh prints it. */
function createIssue(title: string, body: string): Result<string, string> {
  const tooLong = oversizeProblem("issue", body);
  if (tooLong !== undefined) {
    return fail(tooLong);
  }
  const created = runCommand(
    "gh",
    ["issue", "create", "--title", title, "--body-file", "-"],
    { input: `${body}\n` },
  );
  return created.ok ? succeed(created.value.stdout.trim()) : created;
}

/** Reads the head of the pull request as it is now, which differs from the reviewed head after a newer push. */
function readCurrentHead(pullRequestNumber: string): Result<string, string> {
  const head = runCommand("gh", [
    "pr",
    "view",
    pullRequestNumber,
    "--json",
    "headRefOid",
    "--jq",
    ".headRefOid",
  ]);
  return head.ok
    ? parseCommitHash(
        head.value.stdout.trim(),
        "The head of the pull request from gh",
      )
    : head;
}
