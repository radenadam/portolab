import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import { decisionNumberProblems } from "./decision-number-problems.ts";
import { gitForTest } from "./git-for-test.ts";
import { readTextFile } from "./read-text-file.ts";

function writeIndex(folder: string, filenames: readonly string[]): void {
  const text = filenames.length === 0 ? "" : `${filenames.join("\n")}\n`;
  writeFileSync(join(folder, "index.txt"), text);
}

function decisionsFolder(
  files: readonly string[],
  indexedFiles = files,
): string {
  const folder = mkdtempSync(join(tmpdir(), "portolab-decision-numbers-"));
  onTestFinished(() => {
    rmSync(folder, { recursive: true, force: true });
  });
  for (const file of files) {
    writeFileSync(join(folder, file), "");
  }
  writeIndex(folder, indexedFiles);
  return folder;
}

test("accepts distinct numbers even when records have the same title or gaps", () => {
  const folder = decisionsFolder([
    "0001-first.md",
    "0037-same.md",
    "0038-same.md",
  ]);
  expect(decisionNumberProblems(folder)).toEqual([]);
});

test("rejects duplicate numbers and names every conflicting record", () => {
  const folder = decisionsFolder([
    "0037-budget.md",
    "0037-merges.md",
    "0037-third.md",
    "0038-first.md",
    "0038-second.md",
  ]);
  expect(decisionNumberProblems(folder)).toEqual([
    `${folder}: decision number 37 is shared by 0037-budget.md, 0037-merges.md, 0037-third.md. Renumber the record in your pull request and update its heading, links, mentions, and index entry.`,
    `${folder}: decision number 38 is shared by 0038-first.md, 0038-second.md. Renumber the record in your pull request and update its heading, links, mentions, and index entry.`,
  ]);
});

test("rejects the same number with different zero padding", () => {
  const folder = decisionsFolder(["0037-first.md", "37-second.md"]);
  expect(decisionNumberProblems(folder)).toEqual([
    `${folder}: decision number 37 is shared by 0037-first.md, 37-second.md. Renumber the record in your pull request and update its heading, links, mentions, and index entry.`,
  ]);
});

test("ignores unnumbered documents, other file types, and directories", () => {
  const folder = decisionsFolder(
    [
      "0037-record.md",
      "README.md",
      "AGENTS.md",
      "0037-record.txt",
      "0037-record.md.bak",
      "notes-0037-record.md",
    ],
    ["0037-record.md"],
  );
  mkdirSync(join(folder, "0037-directory.md"));
  expect(decisionNumberProblems(folder)).toEqual([]);
});

test("rejects a folder without numbered records so the check cannot pass without checking any", () => {
  const folder = decisionsFolder(["README.md"], []);
  expect(decisionNumberProblems(folder)).toEqual([
    `${folder} must contain numbered decision records, but it has none.`,
  ]);
});

test.each([
  { index: ["0037-a.md"], actual: '"0037-a.md\\n"' },
  {
    index: ["0037-a.md", "0038-b.md", "0039-c.md"],
    actual: '"0037-a.md\\n0038-b.md\\n0039-c.md\\n"',
  },
  {
    index: ["0038-b.md", "0037-a.md"],
    actual: '"0038-b.md\\n0037-a.md\\n"',
  },
])(
  "rejects an index with missing, extra, or out of order records: $actual",
  ({ index, actual }) => {
    const folder = decisionsFolder(["0037-a.md", "0038-b.md"], index);
    expect(decisionNumberProblems(folder)).toEqual([
      `${folder}/index.txt must be "0037-a.md\\n0038-b.md\\n", but it is ${actual}. Update its list of decision filenames with the record in your pull request.`,
    ]);
  },
);

test("accepts the index with the line endings of Windows", () => {
  const folder = decisionsFolder(["0037-a.md", "0038-b.md"]);
  writeFileSync(join(folder, "index.txt"), "0037-a.md\r\n0038-b.md\r\n");
  expect(decisionNumberProblems(folder)).toEqual([]);
});

test("passes on the failure when the index cannot be read", () => {
  const folder = decisionsFolder(["0037-a.md"]);
  const path = join(folder, "index.txt");
  unlinkSync(path);
  const index = readTextFile(`${folder}/index.txt`);
  expect(index.ok).toBe(false);
  if (!index.ok) {
    expect(decisionNumberProblems(folder)).toEqual([index.failure]);
  }
});

test.each(["0039-second.md", "39-second.md"])(
  "makes a parallel %s conflict before merging, then accepts the renumbered record",
  (second) => {
    const folder = decisionsFolder(["0038-base.md", "0041-last.md"]);
    expect(decisionNumberProblems(folder)).toEqual([]);
    gitForTest(folder, ["init", "--quiet", "--initial-branch=main"]);
    gitForTest(folder, ["add", "."]);
    gitForTest(folder, ["commit", "--quiet", "--message=base"]);
    for (const [name, filename] of [
      ["first", "0039-first.md"],
      ["second", second],
    ] as const) {
      gitForTest(folder, ["checkout", "--quiet", "-b", name, "main"]);
      writeFileSync(join(folder, filename), "");
      writeIndex(folder, ["0038-base.md", filename, "0041-last.md"]);
      expect(decisionNumberProblems(folder)).toEqual([]);
      gitForTest(folder, ["add", "."]);
      gitForTest(folder, ["commit", "--quiet", `--message=${name}`]);
    }
    const merge = gitForTest(folder, ["merge", "--no-commit", "first"], [1]);
    expect(merge.code).toBe(1);
    expect(
      gitForTest(folder, [
        "diff",
        "--name-only",
        "--diff-filter=U",
      ]).stdout.trim(),
    ).toBe("index.txt");
    renameSync(join(folder, second), join(folder, "0040-second.md"));
    writeIndex(folder, [
      "0038-base.md",
      "0039-first.md",
      "0040-second.md",
      "0041-last.md",
    ]);
    expect(decisionNumberProblems(folder)).toEqual([]);
    gitForTest(folder, ["add", "."]);
    gitForTest(folder, ["commit", "--quiet", "--message=resolve"]);
  },
);
