import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import { decisionNumberProblems } from "./decision-number-problems.ts";

function decisionsFolder(files: readonly string[]): string {
  const folder = mkdtempSync(join(tmpdir(), "portolab-decision-numbers-"));
  onTestFinished(() => {
    rmSync(folder, { recursive: true, force: true });
  });
  for (const file of files) {
    writeFileSync(join(folder, file), "");
  }
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
    `${folder}: decision number 37 is shared by 0037-budget.md, 0037-merges.md, 0037-third.md. Renumber the record in your pull request and update its heading, links, and mentions.`,
    `${folder}: decision number 38 is shared by 0038-first.md, 0038-second.md. Renumber the record in your pull request and update its heading, links, and mentions.`,
  ]);
});

test("rejects the same number with different zero padding", () => {
  const folder = decisionsFolder(["0037-first.md", "37-second.md"]);
  expect(decisionNumberProblems(folder)).toEqual([
    `${folder}: decision number 37 is shared by 0037-first.md, 37-second.md. Renumber the record in your pull request and update its heading, links, and mentions.`,
  ]);
});

test("ignores unnumbered documents, other file types, and directories", () => {
  const folder = decisionsFolder([
    "0037-record.md",
    "README.md",
    "AGENTS.md",
    "0037-record.txt",
    "0037-record.md.bak",
    "notes-0037-record.md",
  ]);
  mkdirSync(join(folder, "0037-directory.md"));
  expect(decisionNumberProblems(folder)).toEqual([]);
});

test("rejects a folder without numbered records so the check cannot pass without checking any", () => {
  const folder = decisionsFolder(["README.md"]);
  expect(decisionNumberProblems(folder)).toEqual([
    `${folder} must contain numbered decision records, but it has none.`,
  ]);
});
