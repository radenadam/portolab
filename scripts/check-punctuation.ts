import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { matchesGlob } from "node:path";
import { readTextFile } from "./json.ts";
import { readMessages } from "./messages.ts";
import { messageProblems, punctuationProblems } from "./punctuation.ts";
import type { FileKind } from "./punctuation.ts";
import { exitWithFailure } from "./script-failure.ts";

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
    const text = readTextFile(file);
    if (text.ok) {
      problems.push(...punctuationProblems(file, text.value, kind));
    } else {
      problems.push(text.failure);
    }
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
  exitWithFailure(problems);
}

function filesMatching(patterns: string[]): string[] {
  return repositoryFiles.filter((file) =>
    patterns.some((pattern) => matchesGlob(file, pattern)),
  );
}
