import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChangedFiles } from "./review-lenses.ts";
import type { ChangedFile } from "./review-lenses.ts";
import { parseHistoryCommit } from "./review-inputs.ts";
import type { HistoryCommit } from "./review-inputs.ts";
import { runCommand } from "./run-command.ts";

/** Reads the files that a range of git diff changes, such as the whole change of a pull request, in the repository at cwd. */
export function readChangedFiles(
  range: readonly string[],
  cwd?: string,
): Result<ChangedFile[], string> {
  const diff = runCommand(
    "git",
    ["diff", "--name-status", "--no-renames", "-z", ...range],
    { cwd },
  );
  return diff.ok
    ? parseChangedFiles(
        diff.value.stdout,
        `git diff ${range.slice(0, 2).join(" ")}`,
      )
    : diff;
}

/** Returns the head that the last round reviewed when the head of the pull request still contains it, or undefined after a push that rewrote the history, so that the whole change is reviewed again. */
export function containedHead(
  head: string,
  cwd?: string,
): Result<string | undefined, string> {
  const exists = runCommand(
    "git",
    ["rev-parse", "--verify", "--quiet", `${head}^{commit}`],
    { answerCodes: [1], cwd },
  );
  if (!exists.ok) {
    return exists;
  }
  if (exists.value.code !== 0) {
    return succeed(undefined);
  }
  const contained = isAncestor(head, "HEAD", cwd);
  if (!contained.ok) {
    return contained;
  }
  return succeed(contained.value ? head : undefined);
}

/** Which allowance may read the first-parent commits since the reviewed head. A mixed push needs an ordinary review. */
export type CommitScope = "author" | "base-merges" | "mixed";

export interface ReviewChanges {
  files: ChangedFile[];
  commitScope: CommitScope;
}

/** Selects author changes and manual merge resolutions together with their allowance, so a foreign merge cannot hide imported files behind an empty combined diff. */
export function readReviewChangesSince(
  since: string,
  change: { base: string; paths: readonly string[] },
  cwd?: string,
): Result<ReviewChanges, string> {
  const log = runCommand(
    "git",
    ["log", "--first-parent", "--format=%H %P", `${since}..HEAD`],
    { cwd },
  );
  if (!log.ok) {
    return log;
  }
  const changePaths = new Set(change.paths);
  const touched = new Set<string>();
  let commitScope: CommitScope | undefined;
  for (const line of log.value.stdout.trim().split("\n").filter(Boolean)) {
    const commit = parseHistoryCommit(line, "git log");
    if (!commit.ok) {
      return commit;
    }
    const contribution = readCommitChanges(commit.value, change.base, cwd);
    if (!contribution.ok) {
      return contribution;
    }
    const scope = contribution.value.commitScope;
    commitScope =
      commitScope === undefined || commitScope === scope ? scope : "mixed";
    for (const file of contribution.value.files) {
      if (changePaths.has(file.path)) {
        touched.add(file.path);
      }
    }
  }
  // git diff without paths would compare every file.
  const files =
    touched.size === 0
      ? succeed([])
      : readChangedFiles([since, "HEAD", "--", ...touched], cwd);
  return files.ok
    ? succeed({ files: files.value, commitScope: commitScope ?? "author" })
    : files;
}

function readCommitChanges(
  commit: HistoryCommit,
  base: string,
  cwd?: string,
): Result<ReviewChanges, string> {
  const scope = classifyCommit(commit, base, cwd);
  if (!scope.ok) {
    return scope;
  }
  const modes: Record<CommitScope, string> = {
    author: "first-parent",
    "base-merges": "remerge",
    mixed: "first-parent",
  };
  // A remerge compares the recorded result with Git's automatic merge, so disjoint edits in one file do not spend another review round.
  const diff = runCommand(
    "git",
    [
      "show",
      "--format=",
      "--name-status",
      "--no-renames",
      "-z",
      `--diff-merges=${modes[scope.value]}`,
      commit.head,
    ],
    { cwd },
  );
  const files = diff.ok
    ? parseChangedFiles(diff.value.stdout, `git show ${commit.head}`)
    : diff;
  return files.ok
    ? succeed({ files: files.value, commitScope: scope.value })
    : files;
}

function classifyCommit(
  commit: HistoryCommit,
  base: string,
  cwd?: string,
): Result<CommitScope, string> {
  if (commit.parents.length < 2) {
    return succeed("author");
  }
  // Git's remerge diff supports two parents. Other merges need an ordinary review of everything they import.
  if (commit.parents.length !== 2) {
    return succeed("mixed");
  }
  let scope: CommitScope = "base-merges";
  for (const parent of commit.parents.slice(1)) {
    const contained = isAncestor(parent, base, cwd);
    if (!contained.ok) {
      return contained;
    }
    if (!contained.value) {
      scope = "mixed";
    }
  }
  return succeed(scope);
}

function isAncestor(
  head: string,
  descendant: string,
  cwd?: string,
): Result<boolean, string> {
  const contained = runCommand(
    "git",
    ["merge-base", "--is-ancestor", head, descendant],
    { answerCodes: [1], cwd },
  );
  return contained.ok ? succeed(contained.value.code === 0) : contained;
}
