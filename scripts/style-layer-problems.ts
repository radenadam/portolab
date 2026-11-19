import type { SourceFile } from "./read-files-in.ts";

/** The cascade layers of the styles of `app/`, in the order in which they win, as the statement at the start of `app/theme.css` declares them. */
const styleLayers = ["theme", "parts", "features"] as const;

type StyleLayer = (typeof styleLayers)[number];

const themePath = "app/theme.css";

/** The layer of a CSS file of `app/` by its place: the theme, a feature, or a part that several features share. */
function layerOfStyleFile(path: string): StyleLayer {
  if (path === themePath) return "theme";
  if (path.startsWith("app/features/")) return "features";
  return "parts";
}

/** One rule at the top level of a CSS file: a statement that names layers, a block of a layer, or anything else, with the line where it starts. */
type TopLevelRule =
  | { kind: "statement"; names: string[]; line: number }
  | { kind: "block"; name: string; line: number }
  | { kind: "other"; text: string; line: number };

/** Lists every way in which a CSS file of `app/` puts a rule outside the layer of its place, so that a rule of a feature beats a rule of a shared part whatever the order in which the build loads their files. The theme also starts with the statement that sets the order of the layers. */
export function styleLayerProblems(file: SourceFile): string[] {
  const expected = layerOfStyleFile(file.path);
  const rules = topLevelRules(file.text);
  if (!rules.ok)
    return [`${file.path}:${String(rules.line)}: ${rules.failure}`];
  const problems: string[] = [];
  const order = styleLayers.join(", ");
  let rulesToCheck = rules.value;
  if (file.path === themePath) {
    const [first, ...rest] = rules.value;
    if (first?.kind !== "statement" || first.names.join(", ") !== order) {
      problems.push(
        `${file.path}:${String(first?.line ?? 1)}: the theme must start with the statement "@layer ${order}", which sets the order of the layers before any other style of a page, but it starts with ${describeRule(first)}.`,
      );
    }
    rulesToCheck = rest;
  }
  for (const rule of rulesToCheck) {
    if (rule.kind === "block" && rule.name === expected) continue;
    problems.push(
      `${file.path}:${String(rule.line)}: every rule of the file must lie in the layer "${expected}" of its place, but ${describeRule(rule)} lies outside it.`,
    );
  }
  return problems;
}

function describeRule(rule: TopLevelRule | undefined): string {
  if (rule === undefined) return "no rule";
  switch (rule.kind) {
    case "statement":
      return `the statement of the layers ${rule.names.join(", ")}`;
    case "block":
      return `a block of the layer "${rule.name}"`;
    case "other":
      return `the rule "${rule.text}"`;
  }
}

type TopLevelResult =
  | { ok: true; value: TopLevelRule[] }
  | { ok: false; failure: string; line: number };

/** Splits a CSS text into the rules at its top level, skipping comments, and the text of strings and comments inside blocks. */
function topLevelRules(text: string): TopLevelResult {
  const rules: TopLevelRule[] = [];
  let index = afterSpaceAndComments(text, 0);
  while (index !== undefined && index < text.length) {
    const read = readTopLevelRule(text, index);
    if (!read.ok) return read;
    rules.push(read.rule);
    index = afterSpaceAndComments(text, read.end);
  }
  if (index === undefined)
    return {
      ok: false,
      failure: "a comment never ends.",
      line: lineAt(text, text.lastIndexOf("/*")),
    };
  return { ok: true, value: rules };
}

/** Reads the rule at the top level that starts at a position, up to the end of its statement or its block. */
function readTopLevelRule(
  text: string,
  start: number,
):
  | { ok: true; rule: TopLevelRule; end: number }
  | { ok: false; failure: string; line: number } {
  const prelude = readPrelude(text, start);
  const header = text.slice(start, prelude.end).replaceAll(/\s+/g, " ").trim();
  const line = lineAt(text, start);
  const names = /^@layer\s+(.*)$/s
    .exec(header)?.[1]
    ?.split(",")
    .map((name) => name.trim());
  switch (prelude.ends) {
    case ";":
      return {
        ok: true,
        rule:
          names === undefined
            ? { kind: "other", text: `${header};`, line }
            : { kind: "statement", names, line },
        end: prelude.end + 1,
      };
    case "end":
      return {
        ok: false,
        failure: `the rule "${header}" never opens a block or ends.`,
        line,
      };
    case "{": {
      const blockEnd = matchingBrace(text, prelude.end);
      if (blockEnd === undefined)
        return {
          ok: false,
          failure: `the block of "${header}" never closes.`,
          line,
        };
      const name = names?.length === 1 ? names[0] : undefined;
      return {
        ok: true,
        rule:
          name === undefined
            ? { kind: "other", text: header, line }
            : { kind: "block", name, line },
        end: blockEnd + 1,
      };
    }
  }
}

function lineAt(text: string, position: number): number {
  return text.slice(0, position).split("\n").length;
}

/** The position after the space and the comments that start at a position, or undefined when a comment never ends. */
function afterSpaceAndComments(
  text: string,
  start: number,
): number | undefined {
  let index = start;
  while (index < text.length) {
    if (/\s/.test(text.charAt(index))) index += 1;
    else if (text.startsWith("/*", index)) {
      const end = text.indexOf("*/", index + 2);
      if (end === -1) return undefined;
      index = end + 2;
    } else return index;
  }
  return index;
}

/** Reads the text before a block or the end of a statement, past strings and comments. */
function readPrelude(
  text: string,
  start: number,
): { end: number; ends: "{" | ";" | "end" } {
  let index = start;
  while (index < text.length) {
    const character = text.charAt(index);
    if (character === "{" || character === ";")
      return { end: index, ends: character };
    index = afterQuotedOrComment(text, index) ?? index + 1;
  }
  return { end: index, ends: "end" };
}

/** The position of the brace that closes the block that opens at a position, past strings and comments. */
function matchingBrace(text: string, open: number): number | undefined {
  let depth = 0;
  let index = open;
  while (index < text.length) {
    const character = text.charAt(index);
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
    index = afterQuotedOrComment(text, index) ?? index + 1;
  }
  return undefined;
}

/** The position after a string or a comment that starts at a position, or undefined when none starts there. */
function afterQuotedOrComment(text: string, index: number): number | undefined {
  if (text.startsWith("/*", index)) {
    const end = text.indexOf("*/", index + 2);
    return end === -1 ? text.length : end + 2;
  }
  const quote = text.charAt(index);
  if (quote !== '"' && quote !== "'") return undefined;
  let position = index + 1;
  while (position < text.length && text.charAt(position) !== quote) {
    position += text.charAt(position) === "\\" ? 2 : 1;
  }
  return position + 1;
}
