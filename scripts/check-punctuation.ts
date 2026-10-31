import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { matchesGlob } from "node:path";
import { isRecord, readJsonFile } from "./json.ts";

// Prose connects ideas with words, so these characters never join clauses. AGENTS.md states the rule.
const dashes = [
  { character: "\u2014", name: "em dash" },
  { character: "\u2013", name: "en dash" },
];
const semicolon = { character: ";", name: "semicolon" };
const allForbidden = [...dashes, semicolon];

// Git lists the files the repository holds, so generated and ignored files are never checked.
const repositoryFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file !== "");

const proseFiles = filesMatching(["**/*.md", ".github/ISSUE_TEMPLATE/*.yml"]);
const messageFiles = filesMatching(["messages/*.json"]);
const codeFiles = filesMatching([
  "**/*.ts",
  "**/*.tsx",
  ".github/workflows/*.yml",
]);

const problems: string[] = [];

for (const file of proseFiles) {
  checkLines(file, withoutCode(readFileSync(file, "utf8")), allForbidden);
}
for (const file of messageFiles) {
  const messages = readJsonFile(file);
  if (!messages.ok) {
    problems.push(messages.failure);
    continue;
  }
  if (!isRecord(messages.value)) {
    problems.push(`${file} must be a JSON object of messages.`);
    continue;
  }
  for (const [key, text] of Object.entries(messages.value)) {
    if (typeof text === "string") {
      checkText(`${file} (${key})`, text, allForbidden);
    }
  }
}
// Code has no use for a dash, so dashes are rejected anywhere in it, which covers the text that code generates. Semicolons belong to code, so they are rejected only in comments.
for (const file of codeFiles) {
  const text = readFileSync(file, "utf8");
  checkLines(file, text.split("\n"), dashes);
  checkLines(file, commentsOnly(text), [semicolon]);
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exit(1);
}

function filesMatching(patterns: string[]): string[] {
  return repositoryFiles.filter((file) =>
    patterns.some((pattern) => matchesGlob(file, pattern)),
  );
}

function checkLines(
  file: string,
  lines: string[],
  forbidden: readonly { character: string; name: string }[],
): void {
  for (const [index, line] of lines.entries()) {
    checkText(`${file}:${String(index + 1)}`, line, forbidden);
  }
}

function checkText(
  location: string,
  text: string,
  forbidden: readonly { character: string; name: string }[],
): void {
  for (const { character, name } of forbidden) {
    if (text.includes(character)) {
      problems.push(
        `${location}: replace the ${name} with a connecting word or a new sentence.`,
      );
    }
  }
}

// Code blocks and code spans are code, not prose, so they are blanked while keeping line numbers.
function withoutCode(text: string): string[] {
  let isInFence = false;
  return text.split("\n").map((line) => {
    if (line.trimStart().startsWith("```")) {
      isInFence = !isInFence;
      return "";
    }
    return isInFence ? "" : line.replaceAll(/`[^`]*`/g, "");
  });
}

function commentsOnly(text: string): string[] {
  return text.split("\n").map((line) => {
    const trimmed = line.trimStart();
    const isComment = ["//", "/*", "*", "#"].some((marker) =>
      trimmed.startsWith(marker),
    );
    return isComment ? trimmed.replaceAll(/`[^`]*`/g, "") : "";
  });
}
