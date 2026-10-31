import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { exitWithFailure } from "./exit-with-failure.ts";
import { fileKind, punctuationProblems } from "./punctuation.ts";
import { readTextFile } from "./read-text-file.ts";

// Git lists the files the repository holds, so generated and ignored files are never checked. A file deleted but not yet staged is still listed, so it is skipped.
const repositoryFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file !== "" && existsSync(file));

const problems: string[] = [];
for (const file of repositoryFiles) {
  const kind = fileKind(file);
  if (kind !== undefined) {
    const text = readTextFile(file);
    if (text.ok) {
      problems.push(...punctuationProblems(file, text.value, kind));
    } else {
      problems.push(text.failure);
    }
  }
}

if (problems.length > 0) {
  exitWithFailure(problems);
}
