import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChoice } from "../app/value-parsers.ts";
import { describeValue } from "../app/value-shapes.ts";

/** The lenses of the review panel. Each one is defined in `.claude/agents/review-<lens>.md`. */
export const lenses = [
  "architecture",
  "consistency",
  "craft",
  "docs",
  "product",
  "reliability",
  "standards",
] as const;

export type Lens = (typeof lenses)[number];

/** Reads the name of a lens, such as one that the plan of a round lists. */
export function parseLens(
  value: unknown,
  source: string,
): Result<Lens, string> {
  return parseChoice(value, source, lenses);
}

/** A file that a change adds, modifies, or deletes. The workflow turns off the detection of renames, so git reports a rename as a deletion and an addition. */
export interface ChangedFile {
  path: string;
  change: "added" | "modified" | "deleted";
}

const changeOfStatus: Record<string, ChangedFile["change"]> = {
  A: "added",
  M: "modified",
  // A change of type, such as a file that becomes a link, changes the file in place.
  T: "modified",
  D: "deleted",
};

/** Reads what `git diff --name-status --no-renames -z` prints: the status of each file and its path, each ended by a NUL character. */
export function parseChangedFiles(
  value: unknown,
  source: string,
): Result<ChangedFile[], string> {
  if (typeof value !== "string") {
    return fail(
      `${source} must be the text that git diff printed, but it is ${describeValue(value)}.`,
    );
  }
  const fields = value.split("\0");
  // Every field ends with a NUL character, so the text after the last one is empty.
  const rest = fields.pop();
  if (rest !== "" || fields.length % 2 !== 0) {
    return fail(
      `${source} must hold a status and a path for each file, each ended by a NUL character, but it is ${describeValue(value)}.`,
    );
  }
  const files: ChangedFile[] = [];
  for (let index = 0; index < fields.length; index += 2) {
    const status = fields[index] ?? "";
    const path = fields[index + 1] ?? "";
    const change = changeOfStatus[status];
    if (change === undefined) {
      return fail(
        `${source} must give each file the status A, M, T, or D, but ${path} has ${describeValue(status)}.`,
      );
    }
    files.push({ path, change });
  }
  return succeed(files);
}

function isMarkdown(path: string): boolean {
  return path.endsWith(".md");
}

function isMessages(path: string): boolean {
  return path.startsWith("messages/");
}

function isTest(path: string): boolean {
  return (
    path.startsWith("e2e/") ||
    /\.test\.tsx?$/.test(path) ||
    /-for-test\.tsx?$/.test(path)
  );
}

// The files that set how the app is composed, served, and built, and which packages it depends on.
const architectureFiles = [
  "app/root.tsx",
  "app/routes.ts",
  "package.json",
  "pnpm-workspace.yaml",
  "react-router.config.ts",
  "vite.config.ts",
];

// Each rule follows the description of its lens. The product lens builds the app and drives a browser, which costs the most, so it reviews only the files that change what a reader sees.
const lensApplies: Record<Lens, (file: ChangedFile) => boolean> = {
  architecture: (file) =>
    (file.change !== "modified" &&
      !isMarkdown(file.path) &&
      !isTest(file.path)) ||
    file.path.startsWith("server/") ||
    file.path.startsWith("migrations/") ||
    architectureFiles.includes(file.path),
  consistency: () => true,
  craft: (file) => !isMarkdown(file.path) && !isMessages(file.path),
  docs: (file) => !isTest(file.path),
  product: (file) =>
    !isTest(file.path) &&
    (isMessages(file.path) ||
      file.path.startsWith("server/") ||
      file.path === "app/routes.ts" ||
      /^app\/.*\.(tsx|css)$/.test(file.path)),
  reliability: (file) =>
    !isTest(file.path) &&
    !isMarkdown(file.path) &&
    !isMessages(file.path) &&
    !file.path.endsWith(".css"),
  standards: () => true,
};

/** Chooses every lens that applies to at least one of the files under review, so a review without files gets no lens. */
export function chooseLenses(files: readonly ChangedFile[]): Lens[] {
  return lenses.filter((lens) => files.some(lensApplies[lens]));
}
