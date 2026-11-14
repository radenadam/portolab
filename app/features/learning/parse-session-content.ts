import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { contentSession, sessionKinds, termIdPattern } from "./content.ts";
import type { LessonSection, SessionContent, SessionKind } from "./content.ts";
import { parseContentBlocks, parseMarkdown } from "./markdown.ts";
import type { MarkdownSection } from "./markdown.ts";

const sectionOrder: Record<SessionKind, readonly string[]> = {
  short: ["summary", "key-idea", "body", "terms"],
  full: ["summary", "key-idea", "body", "interactive", "terms", "practice"],
  review: ["summary"],
  exam: ["summary"],
};

export function parseSessionContent(
  value: unknown,
  source: string,
  number: number,
): Result<SessionContent, string> {
  const session = contentSession(number);
  if (session === undefined) {
    return fail(
      `${source} must name a session of the course, but its session is ${describeValue(number)}.`,
    );
  }
  const document = parseMarkdown(value, source);
  if (!document.ok) return document;
  const kind = sessionKinds[session];
  const expected = [...sectionOrder[kind]];
  if (session >= 11 && session <= 14)
    expected.splice(expected.length - 1, 0, "unavailable");
  const actual = document.value.sections.map((section) => section.heading);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    return fail(
      `${source} must have sections ${describeValue(expected)} in that order, but its sections are ${describeValue(actual)}.`,
    );
  }
  const sections: LessonSection[] = [];
  for (const section of document.value.sections) {
    const parsed = sectionFromMarkdown(
      section,
      `${source} section ${section.heading}`,
    );
    if (!parsed.ok) return parsed;
    sections.push(parsed.value);
  }
  return succeed({ session, kind, title: document.value.title, sections });
}

function sectionFromMarkdown(
  section: MarkdownSection,
  source: string,
): Result<LessonSection, string> {
  const text = section.text.trim();
  switch (section.heading) {
    case "terms": {
      const termIds = readTermIds(text, source);
      return termIds.ok
        ? succeed({ id: "terms", termIds: termIds.value })
        : termIds;
    }
    case "interactive":
    case "practice":
      return text === ""
        ? succeed({ id: section.heading })
        : fail(
            `${source} must be an empty reserved section, but it is ${describeValue(text)}.`,
          );
    case "summary":
    case "key-idea":
    case "body":
    case "unavailable": {
      const blocks = readProseBlocks(section, source);
      if (!blocks.ok) return blocks;
      return succeed({ id: section.heading, blocks: blocks.value });
    }
    default:
      return fail(
        `${source} must name a lesson section, but its heading is ${describeValue(section.heading)}.`,
      );
  }
}

function readTermIds(text: string, source: string): Result<string[], string> {
  const termIds = text.split("\n").map((line) => line.replace(/^- /u, ""));
  if (
    termIds.length < 2 ||
    termIds.some((id) => !termIdPattern.test(id)) ||
    new Set(termIds).size !== termIds.length
  ) {
    return fail(
      `${source} must list at least two unique term ids, but it is ${describeValue(text)}.`,
    );
  }
  return succeed(termIds);
}

function readProseBlocks(
  section: MarkdownSection,
  source: string,
): ReturnType<typeof parseContentBlocks> {
  const blocks = parseContentBlocks(section.text, source);
  if (!blocks.ok) return blocks;
  const needsOneParagraph = section.heading !== "body";
  if (
    blocks.value.length === 0 ||
    (needsOneParagraph &&
      (blocks.value.length !== 1 || blocks.value[0]?.kind !== "paragraph"))
  ) {
    return fail(
      `${source} must have ${needsOneParagraph ? "one plain paragraph" : "content"}, but it is ${describeValue(section.text.trim())}.`,
    );
  }
  return blocks;
}
