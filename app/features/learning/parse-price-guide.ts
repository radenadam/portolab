import { locales } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue, isRecord } from "../../value-shapes.ts";
import { parseMarkdown, parsePlainParagraph } from "./markdown.ts";

const sections = ["key-idea", "code", "price", "change", "time"] as const;
type PriceGuideSection = (typeof sections)[number];
export interface PriceGuideContent {
  title: string;
  sections: Record<PriceGuideSection, string>;
}

export function parsePriceGuide(
  value: unknown,
  source: string,
): Result<PriceGuideContent[], string> {
  if (!isRecord(value))
    return fail(
      `${source} must map price guide paths to Markdown, but it is ${describeValue(value)}.`,
    );
  const expectedPaths = locales.map((locale) => `./price-guide/${locale}.md`);
  if (
    JSON.stringify(Object.keys(value).sort()) !==
    JSON.stringify(expectedPaths.toSorted())
  )
    return fail(
      `${source} must have files ${describeValue(expectedPaths)}, but it has ${describeValue(Object.keys(value))}.`,
    );
  const guides: PriceGuideContent[] = [];
  const problems: string[] = [];
  for (const path of expectedPaths) {
    const fileSource = `${source} file ${describeValue(path)}`;
    const document = parseMarkdown(value[path], fileSource);
    if (!document.ok) {
      problems.push(document.failure);
      continue;
    }
    if (
      JSON.stringify(
        document.value.sections.map((section) => section.heading),
      ) !== JSON.stringify(sections)
    ) {
      problems.push(
        `${fileSource} must have sections ${describeValue(sections)}, but it has ${describeValue(document.value.sections.map((section) => section.heading))}.`,
      );
      continue;
    }
    const paragraphs = new Map<string, string>();
    for (const section of document.value.sections) {
      const paragraph = parsePlainParagraph(
        section.text,
        `${fileSource} section ${section.heading}`,
      );
      if (paragraph.ok) paragraphs.set(section.heading, paragraph.value);
      else problems.push(paragraph.failure);
    }
    if (paragraphs.size !== sections.length) continue;
    const text = (id: PriceGuideSection): string => {
      const paragraph = paragraphs.get(id);
      if (paragraph === undefined)
        throw new Error(`The parsed price guide has no ${id} section.`);
      return paragraph;
    };
    guides.push({
      title: document.value.title,
      sections: {
        "key-idea": text("key-idea"),
        code: text("code"),
        price: text("price"),
        change: text("change"),
        time: text("time"),
      },
    });
  }
  return problems.length > 0 ? fail(problems.join("\n")) : succeed(guides);
}
