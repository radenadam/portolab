import { describe, expect, it, vi } from "vitest";
import { locales } from "../../paraglide/runtime.js";
import type { Locale } from "../../paraglide/runtime.js";
import type { Result } from "../../result.ts";
import { successValueForTest } from "../../success-value-for-test.ts";
import { sessionCount } from "../classes/course-calendar.ts";
import {
  cannotPractiseSession,
  formulaIds,
  sessionKinds,
  tableIds,
} from "./content.ts";
import type { LearningContent, SessionContent } from "./content.ts";
import { parseLearningContent } from "./parse-learning-content.ts";
import { readLearningContent } from "./read-learning-content.server.ts";

const files = import.meta.glob<string>("./content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

const translations: Record<
  Locale,
  { title: string; term: string; unavailable: string }
> = {
  id: {
    title: "Teori portofolio",
    term: "Diversifikasi",
    unavailable: "Materi ini belum dapat dipraktikkan di simulasi.",
  },
  en: {
    title: "Portfolio theory",
    term: "Diversification",
    unavailable: "This material cannot be practised in the simulation yet.",
  },
};

function failureText(result: Result<unknown, string>): string {
  if (result.ok) throw new Error("Expected malformed content to fail.");
  return result.failure;
}

describe("shipped learning content", () => {
  it("loads every session and glossary in every language through the server entry", () => {
    const content = successValueForTest(
      readLearningContent(),
      "Read shipped content",
    );
    expect(content.map((translation) => translation.locale)).toEqual(locales);
    for (const translation of content) {
      const expected = translations[translation.locale];
      expect(translation.sessions).toHaveLength(sessionCount);
      expect(translation.terms).toHaveLength(43);
      expect(
        translation.sessions.find((session) => session.session === 2)?.title,
      ).toBe(expected.title);
      expect(
        translation.terms.find((term) => term.id === "diversifikasi")?.title,
      ).toBe(expected.term);
      for (const session of translation.sessions) {
        expect(session.kind).toBe(sessionKinds[session.session]);
        if (cannotPractiseSession(session.session))
          checkUnavailable(session, expected.unavailable);
      }
      checkReferences(translation);
    }
  });

  it("rejects missing sessions and glossary files in either language", () => {
    for (const locale of Object.keys(translations)) {
      for (const file of ["session-2", "glossary"]) {
        const missingPath = `./content/${locale}/${file}.md`;
        const changed = Object.fromEntries(
          Object.entries(files).filter(([path]) => path !== missingPath),
        );
        const failure = failureText(
          parseLearningContent(changed, "Course files"),
        );
        expect(failure).toContain(`Course files ${locale} must have`);
      }
    }
  });

  it("rejects malformed files and reports independent failures together", () => {
    const changed = {
      ...files,
      "./content/id/session-1.md": 5,
      "./content/en/session-6.md": "missing title",
    };
    const failure = failureText(parseLearningContent(changed, "Course files"));
    expect(failure).toContain(
      'Course files file "./content/id/session-1.md" must be Markdown text, but it is 5.',
    );
    expect(failure).toContain(
      'Course files file "./content/en/session-6.md" must start with one title, but its first line is "missing title".',
    );
  });

  it.each([
    "./content/fr/session-1.md",
    "./content/en/Session-1.md",
    "./content/en/nested/session-1.md",
    "./content/en/.draft/session-1.md",
    "./content/en/.session-1.md",
    "./content/id/session-17.md",
  ])("rejects an unexpected Markdown path %s", (path) => {
    expect(
      failureText(
        parseLearningContent(
          { ...files, [path]: "# Unexpected" },
          "Course files",
        ),
      ),
    ).toContain(path);
  });

  it("rejects a changed term set, lesson link, or reference in one translation", () => {
    const original = files["./content/en/glossary.md"];
    expect(original).toBeDefined();
    if (original === undefined) throw new Error("Expected shipped glossary.");
    const changes = [
      original.replace("## beta |", "## changed-beta |"),
      original.replace("## beta | Beta | 9", "## beta | Beta | 10"),
      original.replace("{{formula:beta}}", "{{formula:variance}}"),
    ];
    for (const changed of changes) {
      expect(changed).not.toBe(original);
      expect(
        failureText(
          parseLearningContent(
            { ...files, "./content/en/glossary.md": changed },
            "Course files",
          ),
        ),
      ).toContain("every language");
    }
  });

  it("rejects unresolved lesson terms even when both translations share the error", () => {
    const changed = { ...files };
    for (const locale of Object.keys(translations)) {
      const path = `./content/${locale}/session-2.md`;
      const original = changed[path];
      if (original === undefined) throw new Error("Expected shipped lesson.");
      expect(original).toContain("- diversifikasi");
      changed[path] = original.replace("- diversifikasi", "- missing-term");
    }
    const failure = failureText(parseLearningContent(changed, "Course files"));
    expect(failure).toContain(
      'Course files id session 2 must link to a glossary term, but "missing-term" is missing.',
    );
    expect(failure).toContain(
      'Course files en session 2 must link to a glossary term, but "missing-term" is missing.',
    );
  });

  it("rejects different valid lesson term lists and formula references", () => {
    const path = "./content/en/session-2.md";
    const original = files[path];
    if (original === undefined) throw new Error("Expected shipped lesson.");
    for (const [from, to] of [
      ["- diversifikasi", "- beta"],
      ["{{formula:weighted-return}}", "{{formula:beta}}"],
    ]) {
      if (from === undefined || to === undefined)
        throw new Error("Expected a replacement pair.");
      expect(original).toContain(from);
      const failure = failureText(
        parseLearningContent(
          { ...files, [path]: original.replace(from, to) },
          "Course files",
        ),
      );
      expect(failure).toContain(
        "Course files session 2 must have the same sections, term links, and references in every language, but id has",
      );
    }
  });

  it("rejects a collection that is not a path map", () => {
    expect(parseLearningContent([], "Course files")).toEqual({
      ok: false,
      failure: "Course files must map content paths to Markdown, but it is [].",
    });
  });
});

it("names the collection and quotes an invalid path once", () => {
  const path = "./content/not-a-language/missing.md";
  expect(
    parseLearningContent({ ...files, [path]: "# Unexpected" }, "Course files"),
  ).toEqual({
    ok: false,
    failure: `Course files path must name a glossary or session Markdown file in one of ${JSON.stringify(locales)}, but it is ${JSON.stringify(path)}.`,
  });
});

it("loads every configured locale and checks a newly configured locale for coverage and parity", async () => {
  vi.resetModules();
  vi.doMock("../../paraglide/runtime.js", () => ({
    locales: [...locales, "fr"],
  }));
  try {
    const { parseLearningContent: parseConfiguredContent } =
      await import("./parse-learning-content.ts");
    const extraFiles = Object.fromEntries(
      Object.entries(files)
        .filter(([path]) => path.startsWith("./content/en/"))
        .map(([path, markdown]) => [path.replace("/en/", "/fr/"), markdown]),
    );
    expect(Object.keys(extraFiles)).toHaveLength(sessionCount + 1);
    const configuredFiles = { ...files, ...extraFiles };
    const content = successValueForTest(
      parseConfiguredContent(configuredFiles, "Course files"),
      "Read every configured locale",
    );
    expect(content.map((translation) => translation.locale)).toEqual([
      ...locales,
      "fr",
    ]);
    expect(content.at(-1)?.sessions).toHaveLength(sessionCount);

    const missingPath = "./content/fr/session-2.md";
    expect(Object.hasOwn(configuredFiles, missingPath)).toBe(true);
    const missing = Object.fromEntries(
      Object.entries(configuredFiles).filter(([path]) => path !== missingPath),
    );
    expect(
      failureText(parseConfiguredContent(missing, "Course files")),
    ).toContain("Course files fr must have course sessions");

    const glossary = configuredFiles["./content/fr/glossary.md"];
    if (glossary === undefined)
      throw new Error("Expected the additional glossary.");
    expect(glossary).toContain("## beta | Beta | 9");
    const mismatched = {
      ...configuredFiles,
      "./content/fr/glossary.md": glossary.replace(
        "## beta | Beta | 9",
        "## beta | Beta | 10",
      ),
    };
    const failure = failureText(
      parseConfiguredContent(mismatched, "Course files"),
    );
    expect(failure).toContain(
      "must have the same term ids and lesson links in every language",
    );
    expect(failure).toContain("fr has");
  } finally {
    vi.doUnmock("../../paraglide/runtime.js");
    vi.resetModules();
  }
});

function checkUnavailable(session: SessionContent, expected: string): void {
  const notice = session.sections.find(
    (section) => section.id === "unavailable",
  );
  if (notice === undefined || !("blocks" in notice))
    throw new Error("Expected an unavailable notice.");
  expect(
    notice.blocks
      .map((block) => (block.kind === "paragraph" ? block.text : ""))
      .join(" "),
  ).toContain(expected);
}

function checkReferences(content: LearningContent): void {
  const formulas = new Set<string>();
  const tables = new Set<string>();
  const blocks = [
    ...content.sessions.flatMap((session) =>
      session.sections.flatMap((section) =>
        "blocks" in section ? section.blocks : [],
      ),
    ),
    ...content.terms.flatMap((term) => term.blocks),
  ];
  for (const block of blocks) {
    switch (block.kind) {
      case "paragraph":
        break;
      case "formula":
        formulas.add(block.id);
        break;
      case "table":
        tables.add(block.id);
        break;
    }
  }
  expect([...formulas].sort()).toEqual([...formulaIds].sort());
  expect([...tables].sort()).toEqual([...tableIds].sort());
}
