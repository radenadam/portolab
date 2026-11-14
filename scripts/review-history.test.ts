import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import { successValueForTest } from "../app/success-value-for-test.ts";
import {
  containedHead,
  readChangedFiles,
  readReviewChangesSince,
} from "./review-history.ts";
import { runCommand } from "./run-command.ts";

let repository = "";
// The head of the pull request when the last round reviewed it, and a commit of the base branch that the pull request never merged.
let reviewedHead = "";
let unmergedBaseCommit = "";
let beforeMerge = "";
let beforeCleanMerge = "";
let cleanAutomaticMerge = "";
let manualMerge = "";
let topicMerge = "";
let octopusMerge = "";

function automaticText(first: string, last: string): string {
  return [
    first,
    ...Array.from({ length: 10 }, (_unused, index) => String(index)),
    last,
  ].join("\n");
}

function atHead(head: string, check: () => void): void {
  git("checkout", "--quiet", "--detach", head);
  try {
    check();
  } finally {
    git("checkout", "--quiet", "feature");
  }
}

function changes(since: string, paths: readonly string[], base = "main") {
  return readReviewChangesSince(since, { base, paths }, repository);
}

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
  write("automatic.txt", automaticText("start", "end"));
  git("add", ".");
  git("commit", "--quiet", "--message=base");
  git("checkout", "--quiet", "-b", "feature");
  write("a.txt", "a of the pull request");
  write("automatic.txt", automaticText("feature", "end"));
  git("commit", "--quiet", "--all", "--message=feature a");
  reviewedHead = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "main");
  write("b.txt", "b of the base branch");
  write("c.txt", "c of the base branch");
  write("automatic.txt", automaticText("start", "main"));
  git("commit", "--quiet", "--all", "--message=main b c");
  git("checkout", "--quiet", "-b", "unmerged");
  write("b.txt", "b that never reaches the pull request");
  git("commit", "--quiet", "--all", "--message=unmerged b");
  unmergedBaseCommit = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "feature");
  write("c.txt", "c of the pull request");
  git("commit", "--quiet", "--all", "--message=feature c");
  beforeMerge = git("rev-parse", "HEAD");
  git("merge", "--quiet", "main", "--message=merge main");
  write("c.txt", "c resolved");
  git("add", "c.txt");
  git("commit", "--quiet", "--message=merge main");
  beforeCleanMerge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "main");
  write("b.txt", "b updated again on main");
  git("commit", "--quiet", "--all", "--message=main b again");
  git("checkout", "--quiet", "feature");
  git("merge", "--quiet", "main", "--message=merge main cleanly");
  const featureHead = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "-b", "clean-automatic", reviewedHead);
  git("merge", "--quiet", "main", "--message=automatic merge");
  cleanAutomaticMerge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "-b", "manual", beforeMerge);
  git("merge", "--quiet", "main", "--message=manual merge");
  write("c.txt", "c resolved");
  write("integration.txt", "manual integration change");
  git("add", ".");
  git("commit", "--quiet", "--message=manual merge");
  manualMerge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "-b", "topic", featureHead);
  write("topic.txt", "imported topic");
  git("add", ".");
  git("commit", "--quiet", "--message=topic");
  git("checkout", "--quiet", "-b", "foreign", featureHead);
  git("merge", "--quiet", "--no-ff", "topic", "--message=foreign merge");
  topicMerge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "-b", "other-topic", featureHead);
  write("other.txt", "another imported topic");
  git("add", ".");
  git("commit", "--quiet", "--message=other topic");
  git("checkout", "--quiet", "-b", "octopus", featureHead);
  git(
    "merge",
    "--quiet",
    "--no-ff",
    "topic",
    "other-topic",
    "--message=octopus merge",
  );
  octopusMerge = git("rev-parse", "HEAD");
  git("checkout", "--quiet", "feature");
}, 30_000);

afterAll(() => {
  rmSync(repository, { recursive: true, force: true });
});

test("reads the whole change of the pull request against the base branch", () => {
  expect(readChangedFiles(["main...HEAD"], repository)).toEqual({
    ok: true,
    value: [
      { path: "a.txt", change: "modified" },
      { path: "automatic.txt", change: "modified" },
      { path: "c.txt", change: "modified" },
    ],
  });
});

test("reads author changes and conflict resolutions without automatic same-file merges", () => {
  expect(git("diff", "--name-only", reviewedHead, "HEAD")).toBe(
    "automatic.txt\nb.txt\nc.txt",
  );
  expect(changes(reviewedHead, ["a.txt", "automatic.txt", "c.txt"])).toEqual({
    ok: true,
    value: {
      files: [{ path: "c.txt", change: "modified" }],
      commitScope: "mixed",
    },
  });
});

test("recognizes merges of main alone, with and without conflict resolutions", () => {
  expect(changes(beforeMerge, ["automatic.txt", "c.txt"])).toEqual({
    ok: true,
    value: {
      files: [{ path: "c.txt", change: "modified" }],
      commitScope: "base-merges",
    },
  });
  expect(
    changes(beforeCleanMerge, ["a.txt", "automatic.txt", "c.txt"]),
  ).toEqual({
    ok: true,
    value: { files: [], commitScope: "base-merges" },
  });
});

test("uses no round for a clean merge that combines edits in the same file", () => {
  atHead(cleanAutomaticMerge, () => {
    expect(
      git(
        "show",
        "--format=",
        "--name-only",
        "--diff-merges=dense-combined",
        "HEAD",
      ),
    ).toBe("automatic.txt");
    expect(changes(reviewedHead, ["a.txt", "automatic.txt"])).toEqual({
      ok: true,
      value: { files: [], commitScope: "base-merges" },
    });
  });
});

test("reviews every manual integration edit in a main merge", () => {
  atHead(manualMerge, () => {
    expect(
      changes(beforeMerge, ["automatic.txt", "c.txt", "integration.txt"]),
    ).toEqual({
      ok: true,
      value: {
        files: [
          { path: "c.txt", change: "modified" },
          { path: "integration.txt", change: "added" },
        ],
        commitScope: "base-merges",
      },
    });
  });
});

test("rejects a merge allowance for author commits alongside a merge in the same resolved file", () => {
  expect(
    git("log", "--first-parent", "--format=%s", `${reviewedHead}..HEAD`),
  ).toContain("feature c");
  expect(changes(reviewedHead, ["c.txt"])).toEqual({
    ok: true,
    value: {
      files: [{ path: "c.txt", change: "modified" }],
      commitScope: "mixed",
    },
  });
});

test("keeps files imported by foreign and octopus merges under ordinary review", () => {
  const featureHead = git("rev-parse", "HEAD");
  for (const [head, paths] of [
    [topicMerge, ["topic.txt"]],
    [octopusMerge, ["other.txt", "topic.txt"]],
  ] as const) {
    atHead(head, () => {
      expect(changes(featureHead, paths)).toEqual({
        ok: true,
        value: {
          files: paths.map((path) => ({ path, change: "added" })),
          commitScope: "mixed",
        },
      });
    });
  }
});

test("rejects a merge outside main and gives an empty range no merge allowance", () => {
  expect(changes(beforeMerge, ["c.txt"], reviewedHead)).toEqual({
    ok: true,
    value: {
      files: [{ path: "c.txt", change: "modified" }],
      commitScope: "mixed",
    },
  });
  expect(changes(git("rev-parse", "HEAD"), ["c.txt"])).toEqual({
    ok: true,
    value: { files: [], commitScope: "author" },
  });
});

test("classifies author commits for the verifier-only allowance", () => {
  atHead(beforeMerge, () => {
    expect(changes(reviewedHead, ["c.txt"])).toEqual({
      ok: true,
      value: {
        files: [{ path: "c.txt", change: "modified" }],
        commitScope: "author",
      },
    });
  });
});

test("passes on failures to read history, the base, or a diff", () => {
  const cases: [string, string][] = [
    ["missing-head", "main"],
    [beforeMerge, "missing-base"],
  ];
  for (const [since, base] of cases) {
    expect(
      readReviewChangesSince(since, { base, paths: ["c.txt"] }, repository).ok,
    ).toBe(false);
  }
  expect(readChangedFiles(["missing-head...HEAD"], repository).ok).toBe(false);
});

test("reads no file when no path of the change was touched", () => {
  expect(changes(reviewedHead, ["a.txt"])).toEqual({
    ok: true,
    value: { files: [], commitScope: "mixed" },
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
