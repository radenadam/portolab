import { existsSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeAgentRun, parseAgentRun } from "./agent-run.ts";
import { readJsonFile } from "./json.ts";
import { parseFindingsToVerify, parseVerdicts } from "./review-findings.ts";
import { parseCommitHash, parsePullRequestNumber } from "./review-inputs.ts";
import { parseReviewPlan } from "./review-plan.ts";
import { stateMarker } from "./review-state.ts";
import { runCommand } from "./run-command.ts";
import { outsideIssue, summarizeReview } from "./summarize-review.ts";
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
// The plan step failed when it wrote no plan, and its log names the reason.
const plan = readJsonFile("review/plan.json", parseReviewPlan);
if (!pullRequest.ok || !reviewedHead.ok || !plan.ok) {
  exitWithFailure(
    failuresOf([pullRequest, reviewedHead, plan]),
    writeScriptFailure,
  );
}

// A step that failed writes no file, so a missing file stays undefined, and the summary judges whether the plan needed it.
const toVerify = readIfWritten("review/findings.json", (path) =>
  readJsonFile(path, parseFindingsToVerify),
);
const verdicts = readIfWritten("review/verdicts.json", (path) =>
  readJsonFile(path, parseVerdicts),
);
const inputProblems: string[] = [];
for (const input of [toVerify, verdicts]) {
  if (input?.ok === false) {
    inputProblems.push(input.failure);
  }
}

const outcome = summarizeReview({
  plan: plan.value,
  reviewedHead: reviewedHead.value,
  toVerify: toVerify?.ok ? toVerify.value : undefined,
  verdicts: verdicts?.ok ? verdicts.value : undefined,
  runs: [
    measureRun("reviewer", process.env["REVIEWER_TRANSCRIPT"]),
    measureRun("verifier", process.env["VERIFIER_TRANSCRIPT"]),
  ].filter((sentence) => sentence !== ""),
  inputProblems,
});

const issueProblems: string[] = [];
const bodyParts = [outcome.body];
const { outside } = outcome;
if (outside.findings.length > 0 || outside.candidateStandards.length > 0) {
  const issue = outsideIssue(pullRequest.value, outside);
  const created = runCommand(
    "gh",
    ["issue", "create", "--title", issue.title, "--body-file", "-"],
    { input: `${issue.body}\n` },
  );
  if (created.ok) {
    bodyParts.push(
      "",
      `The issue ${created.value.stdout.trim()} records what this round found outside the change.`,
    );
  } else {
    issueProblems.push(created.failure);
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
const posted = runCommand(
  "gh",
  ["pr", "review", pullRequest.value, "--comment", "--body-file", "-"],
  { input: `${bodyParts.join("\n")}\n` },
);
const failures = [...issueProblems];
if (!posted.ok) {
  failures.push(
    `gh could not post the review on pull request ${pullRequest.value}. ${posted.failure}`,
  );
}
if (!outcome.passed) {
  failures.push(outcome.verdict);
}
if (failures.length > 0) {
  exitWithFailure(failures, writeScriptFailure);
}

function readIfWritten<Value>(
  path: string,
  read: (path: string) => Result<Value, string>,
): Result<Value, string> | undefined {
  return existsSync(path) ? read(path) : undefined;
}

/** One sentence about the minutes and the turns of an agent, or an empty one when the agent did not run. A transcript that cannot be read leaves the measure unknown but does not fail the review, which judges only the findings. */
function measureRun(agent: string, transcriptPath: string | undefined): string {
  if (transcriptPath === undefined || transcriptPath === "") {
    return "";
  }
  const run = readJsonFile(transcriptPath, parseAgentRun);
  return run.ok
    ? describeAgentRun(agent, run.value)
    : `The run of the ${agent} could not be measured. ${run.failure}`;
}
