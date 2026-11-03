import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChangedFiles } from "./review-lenses.ts";
import type { ChangedFile } from "./review-lenses.ts";
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
  const contained = runCommand(
    "git",
    ["merge-base", "--is-ancestor", head, "HEAD"],
    { answerCodes: [1], cwd },
  );
  if (!contained.ok) {
    return contained;
  }
  return succeed(contained.value.code === 0 ? head : undefined);
}

/** Reads the files of the change, among paths, that the commits of the pull request changed after a head, including each file whose conflict a merge resolved. A merge of the base branch adds no other file, because the pull request that changed it there had its own review. */
export function readFilesChangedSince(
  since: string,
  paths: readonly string[],
  cwd?: string,
): Result<ChangedFile[], string> {
  // The first parents are the commits of the pull request, and a dense combined diff of a merge holds only the files that differ from every parent, which are the resolved conflicts.
  const log = runCommand(
    "git",
    [
      "log",
      "--first-parent",
      "--format=",
      "--name-only",
      "-z",
      "--diff-merges=dense-combined",
      `${since}..HEAD`,
    ],
    { cwd },
  );
  if (!log.ok) {
    return log;
  }
  const changePaths = new Set(paths);
  const touched = new Set<string>();
  for (const path of log.value.stdout.split(/[\0\n]/)) {
    if (changePaths.has(path)) {
      touched.add(path);
    }
  }
  // git diff without paths would compare every file.
  return touched.size === 0
    ? succeed([])
    : readChangedFiles([since, "HEAD", "--", ...touched], cwd);
}
