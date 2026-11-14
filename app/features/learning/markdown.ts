import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { formulaIds, tableIds } from "./content.ts";
import type { ContentBlock } from "./content.ts";

export interface MarkdownSection {
  heading: string;
  text: string;
}

export interface MarkdownDocument {
  title: string;
  sections: MarkdownSection[];
}

export function parseMarkdown(
  value: unknown,
  source: string,
): Result<MarkdownDocument, string> {
  if (typeof value !== "string") {
    return fail(
      `${source} must be Markdown text, but it is ${describeValue(value)}.`,
    );
  }
  const lines = value.replaceAll("\r\n", "\n").trim().split("\n");
  const title = /^# ([^#\n]+)$/u.exec(lines.shift() ?? "")?.[1];
  if (title === undefined || title.trim() === "") {
    return fail(
      `${source} must start with one title, but its first line is ${describeValue(value.split("\n")[0])}.`,
    );
  }
  const parsedTitle = parsePlainParagraph(title, `${source} title`);
  if (!parsedTitle.ok) return parsedTitle;
  const sections = sectionsFromLines(lines, source);
  if (!sections.ok) return sections;
  return succeed({ title, sections: sections.value });
}

export function parsePlainParagraph(
  value: unknown,
  source: string,
): Result<string, string> {
  const blocks = parseContentBlocks(value, source);
  if (!blocks.ok) return blocks;
  const first = blocks.value[0];
  if (blocks.value.length !== 1 || first?.kind !== "paragraph") {
    return fail(
      `${source} must be one plain paragraph, but it is ${describeValue(value)}.`,
    );
  }
  return succeed(first.text);
}

function sectionsFromLines(
  lines: string[],
  source: string,
): Result<MarkdownSection[], string> {
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | undefined;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      current = { heading: line.slice(3), text: "" };
      sections.push(current);
    } else if (
      line.startsWith("#") ||
      (current === undefined && line.trim() !== "")
    ) {
      return fail(
        `${source} must have only level-two sections after its title, but a line is ${describeValue(line)}.`,
      );
    } else if (current !== undefined) {
      current.text += `${line}\n`;
    }
  }
  if (
    new Set(sections.map((section) => section.heading)).size !== sections.length
  ) {
    return fail(
      `${source} must have unique section headings, but its headings are ${describeValue(sections.map((section) => section.heading))}.`,
    );
  }
  return succeed(sections);
}

export function parseContentBlocks(
  value: unknown,
  source: string,
): Result<ContentBlock[], string> {
  if (typeof value !== "string") {
    return fail(`${source} must be text, but it is ${describeValue(value)}.`);
  }
  const blocks: ContentBlock[] = [];
  for (const paragraph of value.trim().split(/\n\s*\n/u)) {
    if (paragraph === "") continue;
    const formula = formulaIds.find((id) => paragraph === `{{formula:${id}}}`);
    const table = tableIds.find((id) => paragraph === `{{table:${id}}}`);
    if (formula !== undefined) {
      blocks.push({ kind: "formula", id: formula });
    } else if (table !== undefined) {
      blocks.push({ kind: "table", id: table });
    } else {
      const text = paragraph.replaceAll(/\s+/gu, " ");
      if (/[<>{}[\]`*_]|^[#>+|-] |[=²σβρΣ]/u.test(text)) {
        return fail(
          `${source} must have plain paragraphs or known formula and table references, but a paragraph is ${describeValue(paragraph)}.`,
        );
      }
      blocks.push({ kind: "paragraph", text });
    }
  }
  return succeed(blocks);
}
