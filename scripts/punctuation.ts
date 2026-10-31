// Prose connects ideas with words, so these characters never join clauses. AGENTS.md states the rule.
const dashes = [
  { character: "\u2014", name: "em dash" },
  { character: "\u2013", name: "en dash" },
];
const semicolon = { character: ";", name: "semicolon" };

type Forbidden = readonly { character: string; name: string }[];

/** How a file holds its prose, which decides where each character is forbidden. */
export type FileKind = "markdown" | "typescript" | "workflow";

const commentMarkers = {
  typescript: ["//", "/*", "*"],
  workflow: ["#"],
} as const;

/** Returns one sentence for each forbidden character in a file, with the line it is on. */
export function punctuationProblems(
  file: string,
  text: string,
  kind: FileKind,
): string[] {
  if (kind === "markdown") {
    return linesWithForbidden(file, withoutCode(text), [...dashes, semicolon]);
  }
  // Code has no use for a dash, so dashes are rejected on every line, which covers the text that code generates. Semicolons belong to code, so they are rejected only in comments.
  return [
    ...linesWithForbidden(file, text.split("\n"), dashes),
    ...linesWithForbidden(file, commentsOnly(text, commentMarkers[kind]), [
      semicolon,
    ]),
  ];
}

/** Returns one sentence for each forbidden character in the messages of one language file. */
export function messageProblems(
  file: string,
  messages: Record<string, unknown>,
): string[] {
  const problems: string[] = [];
  for (const [key, text] of Object.entries(messages)) {
    if (typeof text === "string") {
      problems.push(
        ...forbiddenIn(`${file} (${key})`, text, [...dashes, semicolon]),
      );
    }
  }
  return problems;
}

function linesWithForbidden(
  file: string,
  lines: string[],
  forbidden: Forbidden,
): string[] {
  const problems: string[] = [];
  for (const [index, line] of lines.entries()) {
    problems.push(
      ...forbiddenIn(`${file}:${String(index + 1)}`, line, forbidden),
    );
  }
  return problems;
}

function forbiddenIn(
  location: string,
  text: string,
  forbidden: Forbidden,
): string[] {
  return forbidden
    .filter(({ character }) => text.includes(character))
    .map(
      ({ name }) =>
        `${location}: replace the ${name} with a connecting word or a new sentence.`,
    );
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

function commentsOnly(text: string, markers: readonly string[]): string[] {
  return text.split("\n").map((line) => {
    const trimmed = line.trimStart();
    const isComment = markers.some((marker) => trimmed.startsWith(marker));
    return isComment ? trimmed.replaceAll(/`[^`]*`/g, "") : "";
  });
}
