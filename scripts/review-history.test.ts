import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import { successValueForTest } from "../app/success-value-for-test.ts";
import {
  containedHead,
  readChangedFiles,
  readFilesChangedSince,
} from "./review-history.ts";
import { runCommand } from "./run-command.ts";

let repository = "";
// The head of the pull request when the last round reviewed it, and a commit of the base branch that the pull request never merged.
let reviewedHead = "";
let unmergedBaseCommit = "";

function git(...commandArguments: string[]): string {
  const run = runCommand(
    "git",
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "core.autocrlf=false",
      ...commandArguments,
    ],
    { cwd: repository, answerCodes: [1] },
  );
  return successValueForTest(
    run,
    `git ${commandArguments.join(" ")}`,
  ).stdout.trim();
}

function write(path: string, text: string): void {
  writeFileSync(join(repository, path), `${text}\n`);
}

// The history: the pull request changes a.txt and c.txt, the base branch changes b.txt and c.txt, and a merge of the base branch resolves the conflict in c.txt.
beforeAll(() => {
  repository = mkdtempSync(join(tmpdir(), "review-history-"));
  git("init", "--quiet", "--initial-branch=main");
  write("a.txt", "a");
  write("b.txt", "b");
  write("c.txt", "c");
  git("add", ".");
  git("commit", "--quiet", "--message=base");
  git("checkout", "--quiet", "-b", "feature");
  write("a.txt", "a of the pull request");
  git("commit", "--quiet", "--all", "--message=feature a");
  reviewedHead = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "main");
  write("b.txt", "b of the base branch");
  write("c.txt", "c of the base branch");
  git("commit", "--quiet", "--all", "--message=main b c");
  git("checkout", "--quiet", "-b", "unmerged");
  write("b.txt", "b that never reaches the pull request");
  git("commit", "--quiet", "--all", "--message=unmerged b");
  unmergedBaseCommit = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "feature");
  write("c.txt", "c of the pull request");
  git("commit", "--quiet", "--all", "--message=feature c");
  git("merge", "--quiet", "main", "--message=merge main");
  write("c.txt", "c resolved");
  git("add", "c.txt");
  git("commit", "--quiet", "--message=merge main");
});

afterAll(() => {
  rmSync(repository, { recursive: true, force: true });
});

test("reads the whole change of the pull request against the base branch", () => {
  expect(readChangedFiles(["main...HEAD"], repository)).toEqual({
    ok: true,
    value: [
      { path: "a.txt", change: "modified" },
      { path: "c.txt", change: "modified" },
    ],
  });
});

test("reads the files that the commits of the pull request and a resolved conflict changed, and leaves out what a merge of the base branch brought", () => {
  const files = readFilesChangedSince(
    reviewedHead,
    ["a.txt", "c.txt"],
    repository,
  );
  expect(git("diff", "--name-only", reviewedHead, "HEAD")).toBe("b.txt\nc.txt");
  expect(files).toEqual({
    ok: true,
    value: [{ path: "c.txt", change: "modified" }],
  });
});

test("reads no file when no path of the change was touched", () => {
  expect(readFilesChangedSince(reviewedHead, ["a.txt"], repository)).toEqual({
    ok: true,
    value: [],
  });
});

test("keeps a reviewed head that the head contains, and drops one that it does not contain or that does not exist", () => {
  expect(containedHead(reviewedHead, repository)).toEqual({
    ok: true,
    value: reviewedHead,
  });
  expect(containedHead(unmergedBaseCommit, repository)).toEqual({
    ok: true,
    value: undefined,
  });
  expect(containedHead("f".repeat(40), repository)).toEqual({
    ok: true,
    value: undefined,
  });
});
