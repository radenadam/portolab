import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { matchesGlob } from "node:path";
import { readMessages } from "./messages.ts";
import { messageProblems, punctuationProblems } from "./punctuation.ts";
import type { FileKind } from "./punctuation.ts";

// Git lists the files the repository holds, so generated and ignored files are never checked. A file deleted but not yet staged is still listed, so it is skipped.
const repositoryFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file !== "" && existsSync(file));

// Issue templates are YAML files whose text is all prose, so they are checked like Markdown.
const issueTemplates = ".github/ISSUE_TEMPLATE/*.yml";
const filesByKind: [FileKind, string[]][] = [
  ["markdown", ["**/*.md", issueTemplates]],
  ["code", ["**/*.ts", "**/*.tsx", "**/*.css"]],
  ["yaml", ["**/*.yml", "**/*.yaml"]],
];

const problems: string[] = [];
for (const [kind, patterns] of filesByKind) {
  const files = filesMatching(patterns).filter(
    (file) => kind === "markdown" || !matchesGlob(file, issueTemplates),
  );
  for (const file of files) {
    problems.push(
      ...punctuationProblems(file, readFileSync(file, "utf8"), kind),
    );
  }
}
for (const file of filesMatching(["messages/*.json"])) {
  const messages = readMessages(file);
  if (messages.ok) {
    problems.push(...messageProblems(file, messages.value));
  } else {
    problems.push(messages.failure);
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
