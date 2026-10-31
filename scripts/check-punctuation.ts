import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { matchesGlob } from "node:path";

// Prose connects ideas with words, so these characters never join clauses. AGENTS.md states the rule.
const forbidden = [
  { character: "—", name: "em dash" },
  { character: "–", name: "en dash" },
  { character: ";", name: "semicolon" },
];

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
const codeFiles = filesMatching(["**/*.ts", "**/*.tsx"]);

const problems: string[] = [];

for (const file of proseFiles) {
  checkLines(file, withoutCode(readFileSync(file, "utf8")));
}
for (const file of messageFiles) {
  const messages = JSON.parse(readFileSync(file, "utf8")) as Record<
    string,
    unknown
  >;
  for (const [key, text] of Object.entries(messages)) {
    if (typeof text === "string") {
      checkText(`${file} (${key})`, text);
    }
  }
}
for (const file of codeFiles) {
  checkLines(file, commentsOnly(readFileSync(file, "utf8")));
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

function checkLines(file: string, lines: string[]): void {
  for (const [index, line] of lines.entries()) {
    checkText(`${file}:${String(index + 1)}`, line);
  }
}

function checkText(location: string, text: string): void {
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
    const isComment =
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*");
    return isComment ? trimmed.replaceAll(/`[^`]*`/g, "") : "";
  });
}
