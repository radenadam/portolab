import { mkdirSync, writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { fail, failuresOf, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { listOfWords } from "../app/sentences.ts";
import { describeValue } from "../app/value-shapes.ts";
import { parseJsonWith } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import { parseAgentTools, parsePullRequestNumber } from "./review-inputs.ts";
import { parseChangedFiles } from "./review-lenses.ts";
import type { ChangedFile } from "./review-lenses.ts";
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
// The files under review are those of the change that changed since the last reviewed head, so a merge of the base branch adds only what it changed in them. git diff without paths would compare every file.
const paths = wholeChange.value.map(({ path }) => path);
const files =
  since.value === undefined || paths.length === 0
    ? wholeChange
    : readChangedFiles([since.value, "HEAD", "--", ...paths]);
if (!files.ok) {
  exitWithFailure([files.failure], writeScriptFailure);
}
const plan = planReview(previous.value, since.value, files.value);

// The later steps of the job read the plan and the diff from this folder of the workspace, where the agents can read them too.
mkdirSync("review", { recursive: true });
writeFileSync("review/plan.json", JSON.stringify(plan, null, 2));
const outputs = [`kind=${plan.kind}`, `round=${String(plan.round)}`];
if (plan.kind === "review") {
  const diff = runCommand(
    "git",
    since.value === undefined
      ? ["diff", `${base}...HEAD`]
      : ["diff", since.value, "HEAD", "--", ...paths],
  );
  const tools = reviewerTools(plan.lenses);
  if (!diff.ok || !tools.ok) {
    exitWithFailure(failuresOf([diff, tools]), writeScriptFailure);
  }
  writeFileSync("review/scope.diff", diff.value.stdout);
  outputs.push(
    `lenses=${listOfWords(plan.lenses)}`,
    `tools=${tools.value}`,
    `product=${String(plan.lenses.includes("product"))}`,
    `scope=${describeReviewScope(since.value)}`,
  );
}
process.stdout.write(`${outputs.join("\n")}\n`);

function readChangedFiles(
  range: readonly string[],
): Result<ChangedFile[], string> {
  const diff = runCommand("git", [
    "diff",
    "--name-status",
    "--no-renames",
    "-z",
    ...range,
  ]);
  return diff.ok
    ? parseChangedFiles(
        diff.value.stdout,
        `git diff ${range.slice(0, 2).join(" ")}`,
      )
    : diff;
}

/** Returns the head that the last round reviewed when the head of the pull request still contains it. After a push that rewrote the history, the whole change is reviewed again. */
function containedHead(head: string): Result<string | undefined, string> {
  const exists = runCommand(
    "git",
    ["rev-parse", "--verify", "--quiet", `${head}^{commit}`],
    { answerCodes: [1] },
  );
  if (!exists.ok) {
    return exists;
  }
  if (exists.value.code !== 0) {
    return succeed(undefined);
  }
  const contained = runCommand(
    "git",
    ["merge-base", "--is-ancestor", head, "HEAD"],
    { answerCodes: [1] },
  );
  if (!contained.ok) {
    return contained;
  }
  return succeed(contained.value.code === 0 ? head : undefined);
}

/** The tools of every chosen lens, because the reviewer applies them all in one session. */
function reviewerTools(
  chosenLenses: readonly string[],
): Result<string, string> {
  const tools = new Set<string>();
  for (const lens of chosenLenses) {
    const path = `.claude/agents/review-${lens}.md`;
    const definition = readTextFile(path);
    const lensTools = definition.ok
      ? parseAgentTools(definition.value, path)
      : definition;
    if (!lensTools.ok) {
      return lensTools;
    }
    for (const tool of lensTools.value.split(",")) {
      tools.add(tool);
    }
  }
  return succeed([...tools].join(","));
}

function parseBranchName(
  value: unknown,
  source: string,
): Result<string, string> {
  return typeof value === "string" && /^[\w.-]+(\/[\w.-]+)*$/.test(value)
    ? succeed(value)
    : fail(
        `${source} must be the name of a branch, but it is ${describeValue(value)}.`,
      );
}
