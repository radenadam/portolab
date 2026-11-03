import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { fail, failuresOf, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChoice } from "../app/value-parsers.ts";
import { readJsonFileIfWritten } from "./json.ts";
import { parseRoundReport, parseVerdicts } from "./review-findings.ts";
import { parseCommitHash, parsePullRequestNumber } from "./review-inputs.ts";
import { parseReviewPlan } from "./review-plan.ts";
import { stateMarker } from "./review-state.ts";
import { runCommand } from "./run-command.ts";
import {
  jobResults,
  oversizeProblem,
  outsideIssue,
  summarizeReview,
  supersededRun,
  unplannedReview,
} from "./summarize-review.ts";
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
const agentsResult = parseChoice(
  process.env["AGENTS_RESULT"],
  "AGENTS_RESULT",
  jobResults,
);
if (!pullRequest.ok || !reviewedHead.ok || !agentsResult.ok) {
  exitWithFailure(
    failuresOf([pullRequest, reviewedHead, agentsResult]),
    writeScriptFailure,
  );
}
if (agentsResult.value === "cancelled") {
  const currentHead = readCurrentHead(pullRequest.value);
  if (!currentHead.ok) {
    exitWithFailure([currentHead.failure], writeScriptFailure);
  }
  const superseded = supersededRun(reviewedHead.value, currentHead.value);
  if (superseded !== undefined) {
    exitWithFailure([superseded], writeScriptFailure);
  }
}

// A step that failed writes no file, so a missing file stays undefined, and the summary judges whether the plan needed it.
const plan = readJsonFileIfWritten("review/plan.json", parseReviewPlan);
if (!plan?.ok) {
  const unplanned = unplannedReview(
    agentsResult.value,
    plan?.ok === false ? plan.failure : undefined,
  );
  postReview(pullRequest.value, unplanned.body);
  exitWithFailure([unplanned.verdict], writeScriptFailure);
}
const report = readJsonFileIfWritten("review/findings.json", parseRoundReport);
const verdicts = readJsonFileIfWritten("review/verdicts.json", parseVerdicts);
const inputProblems: string[] = [];
for (const input of [report, verdicts]) {
  if (input?.ok === false) {
    inputProblems.push(input.failure);
  }
}
const outcome = summarizeReview({
  plan: plan.value,
  reviewedHead: reviewedHead.value,
  report: report?.ok ? report.value : undefined,
  verdicts: verdicts?.ok ? verdicts.value : undefined,
  // The job of the agents measures each agent that ran, and an agent that did not run leaves its sentence empty.
  runs: [process.env["REVIEWER_RUN"], process.env["VERIFIER_RUN"]].filter(
    (sentence): sentence is string => sentence !== undefined && sentence !== "",
  ),
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
