import { expect, it } from "vitest";
import type { Locale } from "../../paraglide/runtime.js";
import { successValueForTest } from "../../success-value-for-test.ts";
import { parseContentBlocks, parseMarkdown } from "./markdown.ts";
import { parseGlossary } from "./parse-glossary.ts";
import { parseSessionContent } from "./parse-session-content.ts";

const prose: Record<Locale, { title: string; paragraph: string }> = {
  id: { title: "Ide", paragraph: "Nilai seluruh portofolio." },
  en: { title: "Idea", paragraph: "The entire portfolio's value." },
};

it("parses wrapped paragraphs and typed references in both languages", () => {
  for (const text of Object.values(prose)) {
    const source = `# ${text.title}\r\n\r\n## body\r\n\r\n${text.paragraph}\r\n\r\n{{formula:beta}}\r\n\r\n{{table:trading-rules}}`;
    const document = successValueForTest(
      parseMarkdown(source, "Lesson"),
      "Read Markdown",
    );
    expect(document.title).toBe(text.title);
    const blocks = successValueForTest(
      parseContentBlocks(document.sections[0]?.text, "Lesson body"),
      "Read blocks",
    );
    expect(blocks).toEqual([
      { kind: "paragraph", text: text.paragraph },
      { kind: "formula", id: "beta" },
      { kind: "table", id: "trading-rules" },
    ]);
    expect(parseContentBlocks("First line\nsecond line", "Body")).toEqual({
      ok: true,
      value: [{ kind: "paragraph", text: "First line second line" }],
    });
  }
});

it.each([undefined, 5, {}, "", "## wrong", "# "])(
  "rejects a missing Markdown title in %j",
  (value) => {
    expect(parseMarkdown(value, "Lesson")).toMatchObject({ ok: false });
  },
);

it.each([
  "# Title\n\nStray prose",
  "# Title\n### nested",
  "# Title\n# another",
  "# Title\n## body\n## body",
])("rejects invalid heading structure in %s", (value) => {
  expect(parseMarkdown(value, "Lesson")).toMatchObject({ ok: false });
});

it.each([
  "{{formula:unknown}}",
  "{{table:unknown}}",
  "Inline {{formula:beta}}",
  "[link](https://example.com)",
  "<script>code</script>",
  "`formula`",
  "**bold**",
  "- a list",
  "E(R) = a formula",
])("rejects unsupported content %s", (value) => {
  expect(parseContentBlocks(value, "Lesson body")).toEqual({
    ok: false,
    failure: `Lesson body must have plain paragraphs or known formula and table references, but a paragraph is ${JSON.stringify(value)}.`,
  });
});

it("rejects non-text blocks with the source and offending value", () => {
  expect(parseContentBlocks(null, "Lesson body")).toEqual({
    ok: false,
    failure: "Lesson body must be text, but it is null.",
  });
});

it("rejects references in document and term titles", () => {
  expect(
    parseMarkdown("# {{formula:beta}}\n## body\n\nBody.", "Lesson"),
  ).toEqual({
    ok: false,
    failure:
      'Lesson title must be one plain paragraph, but it is "{{formula:beta}}".',
  });
  expect(
    parseGlossary(
      "# Glossary\n\n## beta | {{formula:beta}} | 9\n\nBody.",
      "Glossary",
    ),
  ).toEqual({
    ok: false,
    failure:
      'Glossary term beta title must be one plain paragraph, but it is "{{formula:beta}}".',
  });
});

function shortLesson(terms = "- beta\n- capm"): string {
  return `# Title\n\n## summary\n\nSummary.\n\n## key-idea\n\nIdea.\n\n## body\n\nBody.\n\n## terms\n\n${terms}`;
}

it("rejects absent, extra, and reordered lesson sections", () => {
  const valid = shortLesson();
  expect(parseSessionContent(valid, "Lesson", 1).ok).toBe(true);
  for (const changed of [
    valid.replace("## body", "## wrong"),
    valid.replace("## summary", "## body").replace("## key-idea", "## summary"),
    `${valid}\n\n## extra`,
  ]) {
    expect(parseSessionContent(changed, "Lesson", 1)).toMatchObject({
      ok: false,
    });
  }
  expect(parseSessionContent(valid, "Lesson", 17)).toEqual({
    ok: false,
    failure: "Lesson must name a session of the course, but its session is 17.",
  });
});

it.each([
  "",
  "- beta",
  "- beta\n- beta",
  "- beta\n- Wrong",
  "- beta\n- bad id",
])("rejects invalid term lists %s", (terms) => {
  expect(parseSessionContent(shortLesson(terms), "Lesson", 1)).toMatchObject({
    ok: false,
  });
});

it("rejects empty prose and references in single-paragraph sections", () => {
  for (const replacement of ["", "{{formula:beta}}", "First.\n\nSecond."]) {
    expect(
      parseSessionContent(
        shortLesson().replace("Summary.", replacement),
        "Lesson",
        1,
      ),
    ).toMatchObject({ ok: false });
  }
  expect(
    parseSessionContent(shortLesson().replace("Body.", ""), "Lesson", 1),
  ).toMatchObject({ ok: false });
});

it("rejects activity text in a reserved full-lesson section", () => {
  const full =
    shortLesson().replace("## terms", "## interactive\n\n## terms") +
    "\n\n## practice";
  expect(parseSessionContent(full, "Lesson", 2).ok).toBe(true);
  for (const section of ["interactive", "practice"]) {
    expect(
      parseSessionContent(
        full.replace(`## ${section}`, `## ${section}\n\nPretend activity.`),
        "Lesson",
        2,
      ),
    ).toMatchObject({ ok: false });
  }
});

it("parses glossary ids, translated labels, and lesson links in both languages", () => {
  for (const text of Object.values(prose)) {
    const glossary = `# Glossary\n\n## beta | ${text.title} | 9\n\n${text.paragraph}`;
    expect(parseGlossary(glossary, "Glossary")).toEqual({
      ok: true,
      value: [
        {
          id: "beta",
          title: text.title,
          session: 9,
          blocks: [{ kind: "paragraph", text: text.paragraph }],
        },
      ],
    });
  }
});

it.each([
  "# Glossary",
  "# Glossary\n## beta",
  "# Glossary\n## beta | Beta | 17\n\nBody.",
  "# Glossary\n## beta | Beta | 9",
  "# Glossary\n## beta | Beta | 9\n\nBody.\n## beta | Other | 10\n\nBody.",
])("rejects incomplete or duplicate glossary terms in %s", (value) => {
  expect(parseGlossary(value, "Glossary")).toMatchObject({ ok: false });
});
