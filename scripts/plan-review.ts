import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf, succeed } from "../app/result.ts";
import { listOfWords } from "../app/sentences.ts";
import { parseJsonWith } from "./json.ts";
import {
  containedHead,
  readChangedFiles,
  readReviewChangesSince,
} from "./review-history.ts";
import type { ReviewChanges } from "./review-history.ts";
import {
  parseBranchName,
  parsePullRequestNumber,
  readLensTools,
} from "./review-inputs.ts";
import { describeReviewScope, planReview } from "./review-plan.ts";
import { parseLatestReviewState } from "./review-state.ts";
import { runCommand } from "./run-command.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const pullRequest = parsePullRequestNumber(
  process.env["PULL_REQUEST"],
  "PULL_REQUEST",
);
const baseBranch = parseBranchName(process.env["BASE_REF"], "BASE_REF");
if (!pullRequest.ok || !baseBranch.ok) {
  exitWithFailure(failuresOf([pullRequest, baseBranch]), writeScriptFailure);
}
const base = `origin/${baseBranch.value}`;

const reviews = runCommand("gh", [
  "api",
  `repos/{owner}/{repo}/pulls/${pullRequest.value}/reviews`,
  "--paginate",
  "--slurp",
]);
const previous = reviews.ok
  ? parseJsonWith(
      reviews.value.stdout,
      `The reviews of pull request ${pullRequest.value} from gh`,
      parseLatestReviewState,
    )
  : reviews;
const wholeChange = readChangedFiles([`${base}...HEAD`]);
if (!previous.ok || !wholeChange.ok) {
  exitWithFailure(failuresOf([previous, wholeChange]), writeScriptFailure);
}

const since =
  previous.value.head === undefined
    ? succeed(undefined)
    : containedHead(previous.value.head);
if (!since.ok) {
  exitWithFailure([since.failure], writeScriptFailure);
}
const changes =
  since.value === undefined
    ? succeed<ReviewChanges>({
        files: wholeChange.value,
        commitScope: "author",
      })
    : readReviewChangesSince(since.value, {
        base,
        paths: wholeChange.value.map(({ path }) => path),
      });
if (!changes.ok) {
  exitWithFailure([changes.failure], writeScriptFailure);
}
const plan = planReview(
  previous.value,
  { since: since.value, commitScope: changes.value.commitScope },
  changes.value.files,
);

// The later jobs take the plan from this output, which no agent can change, and the JSON has no line breaks, as an output needs.
const outputs = [
  `plan=${JSON.stringify(plan)}`,
  `kind=${plan.kind}`,
  `round=${String(plan.round)}`,
];
if (plan.kind === "review") {
  const tools = readLensTools(plan.lenses);
  if (!tools.ok) {
    exitWithFailure([tools.failure], writeScriptFailure);
  }
  outputs.push(
    `lenses=${listOfWords(plan.lenses)}`,
    `tools=${tools.value}`,
    `product=${String(plan.lenses.includes("product"))}`,
    `scope=${describeReviewScope(since.value, base)}`,
  );
}
process.stdout.write(`${outputs.join("\n")}\n`);
