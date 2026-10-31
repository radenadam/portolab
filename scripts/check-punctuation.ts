import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { matchesGlob } from "node:path";
import { isRecord, readJsonFile } from "./json.ts";
import { messageProblems, punctuationProblems } from "./punctuation.ts";
import type { FileKind } from "./punctuation.ts";

// Git lists the files the repository holds, so generated and ignored files are never checked.
const repositoryFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file !== "");

const filesByKind: [FileKind, string[]][] = [
  ["markdown", ["**/*.md", ".github/ISSUE_TEMPLATE/*.yml"]],
  ["typescript", ["**/*.ts", "**/*.tsx"]],
  ["workflow", [".github/workflows/*.yml"]],
];

const problems: string[] = [];
for (const [kind, patterns] of filesByKind) {
  for (const file of filesMatching(patterns)) {
    problems.push(
      ...punctuationProblems(file, readFileSync(file, "utf8"), kind),
    );
  }
}
for (const file of filesMatching(["messages/*.json"])) {
  const messages = readJsonFile(file);
  if (!messages.ok) {
    problems.push(messages.failure);
  } else if (isRecord(messages.value)) {
    problems.push(...messageProblems(file, messages.value));
  } else {
    problems.push(`${file} must be a JSON object of messages.`);
  }
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
