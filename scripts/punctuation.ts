import ts from "typescript";
import { CST, Lexer } from "yaml";
import { parseJsonObject, parseJsonWith } from "./json.ts";

// Prose connects ideas with words, so these characters never join clauses. AGENTS.md states the rule.
const dashes = [
  { character: "\u2014", name: "em dash" },
  { character: "\u2013", name: "en dash" },
];
const semicolon = { character: ";", name: "semicolon" };

type Forbidden = readonly { character: string; name: string }[];

type CodeKind = "typescript" | "css" | "yaml";

/** How a file holds its prose, which decides where each character is forbidden. */
export type FileKind = "markdown" | "messages" | CodeKind;

/** Decides how a file holds its prose by its place and extension, or returns undefined when the check does not read the file. */
export function fileKind(path: string): FileKind | undefined {
  if (/^messages\/[^/]+\.json$/.test(path)) {
    return "messages";
  }
  // Issue templates are YAML files whose text is all prose.
  if (path.startsWith(".github/ISSUE_TEMPLATE/") || path.endsWith(".md")) {
    return "markdown";
  }
  if (path.endsWith(".ts") || path.endsWith(".tsx")) {
    return "typescript";
  }
  if (path.endsWith(".css")) {
    return "css";
  }
  if (path.endsWith(".yml") || path.endsWith(".yaml")) {
    return "yaml";
  }
  return undefined;
}

/** Returns one sentence for each forbidden character in a file, with the line it is on. */
export function punctuationProblems(
  file: string,
  text: string,
  kind: FileKind,
): string[] {
  if (kind === "markdown") {
    return linesWithForbidden(file, withoutCode(text), [...dashes, semicolon]);
  }
  if (kind === "messages") {
    const messages = parseJsonWith(text, file, parseJsonObject);
    return messages.ok
      ? messageProblems(file, messages.value)
      : [messages.failure];
  }
  // Code and configuration have no use for a dash, so dashes are rejected on every line, which covers the text that code generates. Semicolons belong to code, so they are rejected only in comments.
  return [
    ...linesWithForbidden(file, text.split("\n"), dashes),
    ...linesWithForbidden(file, commentLines(file, text, kind), [semicolon]),
  ];
}

function messageProblems(
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
    return isInFence ? "" : withoutCodeSpans(line);
  });
}

// A code span in prose or in a comment is code, such as `a; b`, so its characters are never judged as prose.
function withoutCodeSpans(line: string): string {
  return line.replaceAll(/`[^`]*`/g, "");
}

/** Returns, for each line of the file, the text of the comments on that line, without code spans. */
function commentLines(file: string, text: string, kind: CodeKind): string[] {
  // Code between comments keeps only its line breaks, so every comment stays on its own line number.
  let commentText = "";
  let position = 0;
  for (const comment of comments(file, text, kind)) {
    commentText += onlyLineBreaks(text.slice(position, comment.start));
    commentText += comment.text;
    position = comment.start + comment.text.length;
  }
  commentText += onlyLineBreaks(text.slice(position));
  return commentText.split("\n").map(withoutCodeSpans);
}

function onlyLineBreaks(text: string): string {
  return text.replaceAll(/[^\n]/g, "");
}

interface Comment {
  start: number;
  text: string;
}

function comments(file: string, text: string, kind: CodeKind): Comment[] {
  switch (kind) {
    case "typescript":
      return typescriptComments(file, text);
    case "css":
      return [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((match) => ({
        start: match.index,
        text: match[0],
      }));
    case "yaml":
      return yamlComments(text);
  }
}

// The parser knows where strings, regular expressions, and JSX text end, so text such as a URL in a string is never taken for a comment.
function typescriptComments(file: string, text: string): Comment[] {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const commentsByStart = new Map<number, Comment>();
  const visit = (node: ts.Node): void => {
    const ranges = [
      ...(ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []),
      ...(ts.getTrailingCommentRanges(text, node.getEnd()) ?? []),
    ];
    for (const range of ranges) {
      commentsByStart.set(range.pos, {
        start: range.pos,
        text: text.slice(range.pos, range.end),
      });
    }
    for (const child of node.getChildren(sourceFile)) {
      visit(child);
    }
  };
  visit(sourceFile);
  return [...commentsByStart.values()].sort(
    (first, second) => first.start - second.start,
  );
}

// The lexer marks the structure of the file with control characters that are not part of its text, so they do not move the offset. A byte order mark is part of the text, so it is not among them.
const yamlControlTokens = new Set([CST.DOCUMENT, CST.FLOW_END, CST.SCALAR]);

// The YAML lexer knows where quoted and block scalars end, so a # inside them is never taken for a comment.
function yamlComments(text: string): Comment[] {
  const found: Comment[] = [];
  let offset = 0;
  for (const token of new Lexer().lex(text)) {
    if (!yamlControlTokens.has(token)) {
      if (CST.tokenType(token) === "comment") {
        found.push({ start: offset, text: token });
      }
      offset += token.length;
    }
  }
  return found;
}
