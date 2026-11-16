import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import routes from "../../routes";
import en from "../../../messages/en.json";
import id from "../../../messages/id.json";
import { defaultStartingCash } from "../classes/class-rules";
import { sessionCount } from "../classes/course-calendar";
import { defaultEstimationSettings } from "../measures/estimation-settings";
import { formatNumber, formatRupiah } from "../../formatting";
import { languageNames } from "../../language-names";
import { locales } from "../../paraglide/runtime.js";
import type { Locale } from "../../paraglide/runtime.js";
import { successValueForTest } from "../../success-value-for-test";
import { switchLocaleForTest } from "../../switch-locale-for-test";
import { guideSectionIds } from "./guide-section-ids";
import { guideLinks } from "./guide-references";
import { GuideView } from "./guide-view";
import { parseGuideContent } from "./parse-guide-content";
import { readGuideContent } from "./read-guide-content.server";

const files = import.meta.glob<string>("./guide/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

const texts: Record<Locale, { title: string; contents: string }> = {
  id: { title: "Panduan dosen", contents: "Isi panduan" },
  en: { title: "Lecturer guide", contents: "Guide contents" },
};

for (const locale of locales) {
  test(`renders the complete guide with message labels and constant values in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const guide = successValueForTest(
      readGuideContent(),
      "Read shipped guide",
    ).find((entry) => entry.locale === locale);
    if (guide === undefined)
      throw new Error("The shipped guide has no translation.");
    expect(guide.title).toBe(texts[locale].title);
    expect(guide.sections.map((section) => section.id)).toEqual(
      guideSectionIds,
    );
    const messages = new Map<string, string>(
      Object.entries({ id, en }[locale]),
    );
    const values = new Map<string, string>([
      [
        "value:starting-cash",
        formatRupiah(defaultStartingCash, "standard", locale),
      ],
      ["value:sessions", formatNumber(sessionCount, undefined, locale)],
      [
        "value:minimum-returns",
        formatNumber(
          defaultEstimationSettings.minimumReturnCount,
          undefined,
          locale,
        ),
      ],
      [
        "value:return-window",
        formatNumber(defaultEstimationSettings.returnCount, undefined, locale),
      ],
    ]);
    const seenValues = new Set<string>();
    for (const part of guide.sections.flatMap((section) =>
      section.paragraphs.flat(),
    )) {
      if (part.kind === "label")
        expect(part.text).toBe(
          messages.get(part.reference.slice("label:".length)),
        );
      if (part.kind === "value") {
        expect(part.text).toBe(values.get(part.reference));
        seenValues.add(part.reference);
      }
    }
    expect([...seenValues].sort()).toEqual([...values.keys()].sort());
    const html = renderToStaticMarkup(<GuideView guide={guide} />);
    const visibleText = html.replaceAll(/<[^>]+>/gu, "");
    expect(html).toContain(`<h1>${texts[locale].title}</h1>`);
    expect(html).toContain(`<summary>${texts[locale].contents}</summary>`);
    expect(html).toContain(`aria-label="${texts[locale].contents}"`);
    expect(html).not.toContain("{{");
    for (const section of guide.sections) {
      expect(html).toContain(`href="#${section.id}"`);
      expect(html).toContain(`id="${section.id}"`);
      for (const paragraph of section.paragraphs) {
        const text = paragraph
          .map((part) => (part.kind === "label" ? `"${part.text}"` : part.text))
          .join("");
        const expected = renderToStaticMarkup(<p>{text}</p>).replaceAll(
          /<[^>]+>/gu,
          "",
        );
        expect(visibleText).toContain(expected);
      }
    }
    expect(html.match(/<p>/gu)).toHaveLength(
      guide.sections.flatMap((section) => section.paragraphs).length,
    );
  });
}

test("keeps the spaces around references when guide prose wraps onto lines", () => {
  const reflowed = Object.fromEntries(
    Object.entries(files).map(([path, markdown]) => [
      path,
      markdown.replaceAll("}}, ", "}},\n    "),
    ]),
  );
  expect(
    successValueForTest(
      parseGuideContent(reflowed, "Wrapped guides"),
      "Read wrapped guides",
    ),
  ).toEqual(
    successValueForTest(parseGuideContent(files, "Guides"), "Read guides"),
  );
});

test("links only to registered app routes and existing deployment sections", () => {
  const paths = routePaths(routes);
  const deployment = readFileSync(
    new URL("../../../docs/deploy.md", import.meta.url),
    "utf8",
  );
  const anchors = [...deployment.matchAll(/^## (.+)$/gmu)].map((match) =>
    match[1]
      ?.toLowerCase()
      .replaceAll(/[^\p{L}\p{N} -]/gu, "")
      .replaceAll(" ", "-"),
  );
  const links = new Set<string>();
  for (const guide of successValueForTest(readGuideContent(), "Read links")) {
    for (const part of guide.sections.flatMap((section) =>
      section.paragraphs.flat(),
    )) {
      if (part.kind !== "link") continue;
      links.add(part.href);
      expectGuideLink(part.href, paths, anchors);
    }
  }
  expect([...links].sort()).toEqual(Object.values(guideLinks).sort());
});

function expectGuideLink(
  href: string,
  paths: readonly string[],
  anchors: readonly (string | undefined)[],
): void {
  if (href.startsWith("/")) expect(paths).toContain(href);
  else {
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe(guideLinks.deployment);
    if (url.hash !== "") expect(anchors).toContain(url.hash.slice(1));
  }
}

function routePaths(
  entries: readonly RouteConfigEntry[],
  parent = "",
): string[] {
  const paths: string[] = [];
  for (const entry of entries) {
    const path = entry.path === undefined ? parent : `${parent}/${entry.path}`;
    paths.push(path);
    if (entry.children !== undefined)
      paths.push(...routePaths(entry.children, path));
  }
  return paths;
}

test("rejects malformed collections and reports independent file failures", () => {
  expect(parseGuideContent([], "Guides")).toEqual({
    ok: false,
    failure: "Guides must map guide paths to Markdown, but it is [].",
  });
  const parsed = parseGuideContent(
    { "./guide/id.md": 4, "./guide/en.md": "missing title" },
    "Guides",
  );
  expect(parsed).toMatchObject({ ok: false });
  if (!parsed.ok) {
    expect(parsed.failure).toContain(
      'Guides file "./guide/id.md" must be Markdown text, but it is 4.',
    );
    expect(parsed.failure).toContain(
      'Guides file "./guide/en.md" must start with one title',
    );
  }
});

test.each([
  "./guide/fr.md",
  "./guide/en/draft.md",
  "./guide/.id.md",
  "./guide/EN.md",
])("rejects an unexpected path %s", (path) => {
  expect(
    parseGuideContent({ ...files, [path]: files["./guide/id.md"] }, "Guides"),
  ).toMatchObject({ ok: false });
});

for (const locale of locales) {
  const path = `./guide/${locale}.md`;
  test.each([
    "Before {{link:privacy|Privacy}} after.",
    "{{link:privacy|Privacy}} {{link:account|Account}}",
    "{{value:sessions}}{{link:privacy|Privacy}}",
    "{{label:navigation_class_link}}{{link:privacy|Privacy}}",
  ])(
    `rejects a link beside other content in ${languageNames[locale]}: %s`,
    (paragraph) => {
      const original = files[path];
      if (original === undefined)
        throw new Error("The guide fixture is missing.");
      const result = parseGuideContent(
        { ...files, [path]: `${original}\n\n${paragraph}` },
        "Guides",
      );
      expect(result).toMatchObject({ ok: false });
      if (!result.ok)
        expect(result.failure).toContain(
          "must put each link reference in a paragraph of its own",
        );
    },
  );

  test(`rejects a missing ${languageNames[locale]} guide`, () => {
    expect(
      parseGuideContent(
        Object.fromEntries(
          Object.entries(files).filter(([name]) => name !== path),
        ),
        "Guides",
      ),
    ).toMatchObject({ ok: false });
  });

  test.each([
    '"Class"',
    "24 months",
    "٢٤ months",
    "/privacy",
    "/GUIDE",
    "https://example.com",
    "HTTP://example.com",
    "//portolab.test",
    "C:\\guide",
    "Plain | text",
    "[link](/privacy)",
    "<script>test</script>",
    "{{label:missing_label}}",
    "{{label:classes_share_notice}}",
    "{{label:classes_reset_body}}",
    "{{value:missing}}",
    "{{link:missing|Open}}",
    "{{link:privacy}}",
    "{{link:privacy|Open|Extra}}",
    "{{link:privacy|24}}",
    "{{value:sessions}",
  ])(
    `rejects unmanaged text or an unknown reference %s in ${languageNames[locale]}`,
    (invalid) => {
      const original = files[path];
      if (original === undefined)
        throw new Error("The guide fixture is missing.");
      expect(
        parseGuideContent(
          { ...files, [path]: `${original}\n\n${invalid}` },
          "Guides",
        ),
      ).toMatchObject({ ok: false });
    },
  );

  test(`rejects missing, duplicate, reordered, empty, and malformed sections in ${languageNames[locale]}`, () => {
    const original = files[path];
    if (original === undefined)
      throw new Error("The guide fixture is missing.");
    for (const changed of [
      original.replace(/\n## server \|[\s\S]*$/u, ""),
      original.replace("## workspace |", "## sample |"),
      original.replace("## sample |", "## workspace |"),
      original.replace(
        /(## privacy \|[^\n]+)\n[\s\S]*?(?=\n## server)/u,
        "$1\n",
      ),
      original.replace("## sample |", "## sample | Extra |"),
    ])
      expect(
        parseGuideContent({ ...files, [path]: changed }, "Guides"),
      ).toMatchObject({ ok: false });
  });
}

test("rejects changed or reordered references in one translation", () => {
  const path = "./guide/en.md";
  const original = files[path];
  if (original === undefined) throw new Error("The guide fixture is missing.");
  for (const changed of [
    original.replace("{{value:sessions}}", "{{value:return-window}}"),
    original.replace("{{label:navigation_class_link}}", ""),
    original.replace(
      "{{label:navigation_class_link}}, {{label:navigation_students_link}}",
      "{{label:navigation_students_link}}, {{label:navigation_class_link}}",
    ),
  ]) {
    const result = parseGuideContent({ ...files, [path]: changed }, "Guides");
    expect(result).toEqual({
      ok: false,
      failure:
        "Guides must have the same sections and references in every language, but en and id differ.",
    });
  }
});
