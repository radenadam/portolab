import { locales } from "../../paraglide/runtime.js";
import type { Locale } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue, isRecord } from "../../value-shapes.ts";
import { guideSectionIds } from "./guide-section-ids.ts";
import type { GuideContent, GuidePart } from "./guide-content.ts";
import { guideLinks, guideReferences } from "./guide-references.ts";
import {
  normalizeContentWhitespace,
  parseMarkdown,
  parsePlainParagraph,
} from "./markdown.ts";

export function parseGuideContent(
  value: unknown,
  source: string,
): Result<GuideContent[], string> {
  if (!isRecord(value))
    return fail(
      `${source} must map guide paths to Markdown, but it is ${describeValue(value)}.`,
    );
  const guides: GuideContent[] = [];
  const problems: string[] = [];
  for (const [path, markdown] of Object.entries(value)) {
    const locale = locales.find(
      (language) => path === `./guide/${language}.md`,
    );
    if (locale === undefined) {
      problems.push(
        `${source} path must name a guide in ${describeValue(locales)}, but it is ${describeValue(path)}.`,
      );
      continue;
    }
    const guide = parseGuide(
      markdown,
      `${source} file ${describeValue(path)}`,
      locale,
    );
    if (guide.ok) guides.push(guide.value);
    else problems.push(guide.failure);
  }
  for (const locale of locales) {
    if (!guides.some((guide) => guide.locale === locale))
      problems.push(
        `${source} must have a valid ${locale} guide, but it has none.`,
      );
  }
  const first = guides[0];
  if (first !== undefined) {
    for (const guide of guides.slice(1)) {
      if (JSON.stringify(structure(first)) !== JSON.stringify(structure(guide)))
        problems.push(
          `${source} must have the same sections and references in every language, but ${first.locale} and ${guide.locale} differ.`,
        );
    }
  }
  return problems.length > 0 ? fail(problems.join("\n")) : succeed(guides);
}

function parseGuide(
  value: unknown,
  source: string,
  locale: Locale,
): Result<GuideContent, string> {
  const document = parseMarkdown(value, source);
  if (!document.ok) return document;
  const sections: GuideContent["sections"] = [];
  const references = guideReferences(locale);
  if (!references.ok) return references;
  for (const [index, section] of document.value.sections.entries()) {
    const expected = guideSectionIds[index];
    if (expected === undefined || !section.heading.startsWith(`${expected} | `))
      return fail(
        `${source} section must be ${describeValue(expected)} followed by a title, but it is ${describeValue(section.heading)}.`,
      );
    const heading = parseGuidePlainText(
      section.heading.slice(`${expected} | `.length),
      `${source} section ${expected} title`,
    );
    if (!heading.ok) return heading;
    const paragraphs: GuidePart[][] = [];
    for (const paragraph of section.text.trim().split(/\n\s*\n/u)) {
      const parsed = parseGuideParagraph(
        paragraph,
        `${source} section ${expected}`,
        references.value,
      );
      if (!parsed.ok) return parsed;
      paragraphs.push(parsed.value);
    }
    sections.push({ id: expected, title: heading.value, paragraphs });
  }
  if (sections.length !== guideSectionIds.length)
    return fail(
      `${source} must have sections ${describeValue(guideSectionIds)}, but it has ${describeValue(sections.map((section) => section.id))}.`,
    );
  const title = parseGuidePlainText(document.value.title, `${source} title`);
  return title.ok ? succeed({ locale, title: title.value, sections }) : title;
}

function parseGuidePlainText(
  value: unknown,
  source: string,
): Result<string, string> {
  const plain = parsePlainParagraph(value, source);
  if (!plain.ok) return plain;
  if (/(?<![\p{L}\p{N}])\p{N}|["“”/\\|]/u.test(plain.value))
    return fail(
      `${source} must have plain guide text with references for labels, numbers, and addresses, but it is ${describeValue(plain.value)}.`,
    );
  return plain;
}

function parseGuideParagraph(
  value: unknown,
  source: string,
  references: ReadonlyMap<string, string>,
): Result<GuidePart[], string> {
  if (typeof value !== "string")
    return fail(`${source} must be text, but it is ${describeValue(value)}.`);
  const parts: GuidePart[] = [];
  for (const text of value.split(/(\{\{[^{}]+\}\})/u)) {
    if (text === "") continue;
    if (text.startsWith("{{") && text.endsWith("}}")) {
      const part = guideReferencePart(text.slice(2, -2), source, references);
      if (!part.ok) return part;
      parts.push(part.value);
      continue;
    }
    const plain =
      text.trim() === "" ? succeed(text) : parseGuidePlainText(text, source);
    if (!plain.ok) return plain;
    parts.push({ kind: "text", text: normalizeContentWhitespace(text) });
  }
  const link = parts.find((part) => part.kind === "link");
  if (
    link !== undefined &&
    parts.some(
      (part) =>
        part !== link && (part.kind !== "text" || part.text.trim() !== ""),
    )
  )
    return fail(
      `${source} must put each link reference in a paragraph of its own, but it is ${describeValue(value)}.`,
    );
  return parts.length === 0
    ? fail(`${source} must have a paragraph, but it is empty.`)
    : succeed(parts);
}

function guideReferencePart(
  reference: string,
  source: string,
  references: ReadonlyMap<string, string>,
): Result<GuidePart, string> {
  const [name, label] = reference.split("|");
  const links = new Map<string, string>(Object.entries(guideLinks));
  const href =
    name?.startsWith("link:") === true
      ? links.get(name.slice("link:".length))
      : undefined;
  if (
    href !== undefined &&
    label !== undefined &&
    reference.split("|").length === 2
  ) {
    const parsed = parseGuidePlainText(label, source);
    if (!parsed.ok) return parsed;
    return succeed({
      kind: "link",
      reference: name ?? "",
      text: parsed.value,
      href,
    });
  }
  const resolved = references.get(reference);
  return resolved === undefined
    ? fail(
        `${source} must name a known guide reference, but it names ${describeValue(reference)}.`,
      )
    : succeed({
        kind: reference.startsWith("label:") ? "label" : "value",
        reference,
        text: resolved,
      });
}

function structure(guide: GuideContent): unknown[] {
  return guide.sections.map((section) => ({
    id: section.id,
    references: section.paragraphs
      .flat()
      .flatMap((part) => (part.kind === "text" ? [] : [part.reference])),
  }));
}
