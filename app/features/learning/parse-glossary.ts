import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { contentSession, termIdPattern } from "./content.ts";
import type { GlossaryTerm } from "./content.ts";
import {
  parseContentBlocks,
  parseMarkdown,
  parsePlainParagraph,
} from "./markdown.ts";

export function parseGlossary(
  value: unknown,
  source: string,
): Result<GlossaryTerm[], string> {
  const document = parseMarkdown(value, source);
  if (!document.ok) return document;
  const terms: GlossaryTerm[] = [];
  for (const section of document.value.sections) {
    const heading = parseTermHeading(section.heading, source);
    if (!heading.ok) return heading;
    const { id, title, session } = heading.value;
    const blocks = parseContentBlocks(section.text, `${source} term ${id}`);
    if (!blocks.ok) return blocks;
    if (blocks.value.length === 0 || terms.some((term) => term.id === id)) {
      return fail(
        `${source} must have unique terms with content, but term ${describeValue(id)} is repeated or empty.`,
      );
    }
    terms.push({ id, title, session, blocks: blocks.value });
  }
  if (terms.length === 0)
    return fail(`${source} must have terms, but its sections are empty.`);
  return succeed(terms);
}

function parseTermHeading(
  value: unknown,
  source: string,
): Result<Pick<GlossaryTerm, "id" | "title" | "session">, string> {
  if (typeof value !== "string")
    return fail(
      `${source} must have a term heading, but it is ${describeValue(value)}.`,
    );
  const parts = /^([^|]+) \| ([^|]+) \| ([1-9][0-9]*)$/u.exec(value);
  const id = parts?.[1];
  const title = parts?.[2];
  const session = contentSession(Number(parts?.[3]));
  if (
    id === undefined ||
    !termIdPattern.test(id) ||
    title === undefined ||
    title.trim() === "" ||
    session === undefined
  ) {
    return fail(
      `${source} must head each term with an id, a title, and a course session separated by |, but a heading is ${describeValue(value)}.`,
    );
  }
  const parsedTitle = parsePlainParagraph(title, `${source} term ${id} title`);
  if (!parsedTitle.ok) return parsedTitle;
  return succeed({ id, title: parsedTitle.value, session });
}
