import { expect, test } from "vitest";
import { fileKind, punctuationProblems } from "./punctuation.ts";

const emDash = "\u2014";

function semicolonAt(location: string): string {
  return `${location}: replace the semicolon with a connecting word or a new sentence.`;
}

test("selects files by extension, including files in dot directories", () => {
  expect(fileKind(".github/workflows/review.yml")).toBe("yaml");
  expect(fileKind(".github/dependabot.yml")).toBe("yaml");
  expect(fileKind("pnpm-workspace.yaml")).toBe("yaml");
  expect(fileKind(".claude/agents/review-craft.md")).toBe("markdown");
  expect(fileKind(".github/pull_request_template.md")).toBe("markdown");
  expect(fileKind(".github/ISSUE_TEMPLATE/bug.yml")).toBe("markdown");
  expect(fileKind("app/root.tsx")).toBe("typescript");
  expect(fileKind("scripts/json.ts")).toBe("typescript");
  expect(fileKind("app/theme.css")).toBe("css");
  expect(fileKind("messages/en.json")).toBe("messages");
  expect(fileKind("project.inlang/settings.json")).toBeUndefined();
  expect(fileKind("package.json")).toBeUndefined();
});

test("accepts semicolons in TypeScript code, strings, and JSX text", () => {
  expect(
    punctuationProblems(
      "a.tsx",
      [
        "class A {",
        "  #count = 0;",
        "}",
        'const url = "http://a.test/b; c";',
        "const page = <p>See http://a.test; then go on.</p>;",
      ].join("\n"),
      "typescript",
    ),
  ).toEqual([]);
});

test("rejects a semicolon in every kind of TypeScript comment", () => {
  expect(
    punctuationProblems(
      "a.tsx",
      [
        "// One; two.",
        "const value = 1; // One; two.",
        "/*",
        "  One; two.",
        "*/",
        "const page = <p>{/* One; two. */}</p>;",
      ].join("\n"),
      "typescript",
    ),
  ).toEqual([
    semicolonAt("a.tsx:1"),
    semicolonAt("a.tsx:2"),
    semicolonAt("a.tsx:4"),
    semicolonAt("a.tsx:6"),
  ]);
});

test("rejects a dash inside a string in code", () => {
  expect(
    punctuationProblems(
      "a.ts",
      `const verdict = "Failed ${emDash} retry";`,
      "typescript",
    ),
  ).toEqual([
    "a.ts:1: replace the em dash with a connecting word or a new sentence.",
  ]);
});

test("rejects a semicolon in a CSS comment and accepts one in a rule", () => {
  expect(
    punctuationProblems("a.css", "a { color: red; }\n/* One; two. */", "css"),
  ).toEqual([semicolonAt("a.css:2")]);
});

test("rejects a semicolon in a YAML comment and accepts one in a value", () => {
  expect(
    punctuationProblems(
      "a.yml",
      [
        "# One; two.",
        "key: value # One; two.",
        "run: echo it's done # One; two.",
        "run: echo a; echo b",
        'run: "a # b; c"',
        "run: |",
        "  echo a # b; c",
      ].join("\n"),
      "yaml",
    ),
  ).toEqual([
    semicolonAt("a.yml:1"),
    semicolonAt("a.yml:2"),
    semicolonAt("a.yml:3"),
  ]);
});

test("reports the right line in a file that starts with a byte order mark", () => {
  const byteOrderMark = "\uFEFF";
  expect(
    punctuationProblems("a.yml", `${byteOrderMark}a: 1\n# One; two.`, "yaml"),
  ).toEqual([semicolonAt("a.yml:2")]);
  expect(
    punctuationProblems(
      "a.ts",
      `${byteOrderMark}const value = 1;\n// One; two.`,
      "typescript",
    ),
  ).toEqual([semicolonAt("a.ts:2")]);
  expect(
    punctuationProblems(
      "a.css",
      `${byteOrderMark}a { color: red; }\n/* One; two. */`,
      "css",
    ),
  ).toEqual([semicolonAt("a.css:2")]);
});

test("ignores code spans and code blocks in Markdown", () => {
  expect(
    punctuationProblems(
      "a.md",
      "Run `a; b` first.\n```sh\na; b\n```",
      "markdown",
    ),
  ).toEqual([]);
});

test("rejects a semicolon in Markdown prose", () => {
  expect(
    punctuationProblems("a.md", "It runs; then it stops.", "markdown"),
  ).toEqual([semicolonAt("a.md:1")]);
});

test("rejects a dash in a message and names its key", () => {
  expect(
    punctuationProblems(
      "messages/en.json",
      JSON.stringify({ app_name: `Porto ${emDash} lab` }),
      "messages",
    ),
  ).toEqual([
    "messages/en.json (app_name): replace the em dash with a connecting word or a new sentence.",
  ]);
});

test("reports a messages file that is not a JSON object", () => {
  expect(punctuationProblems("messages/en.json", "[]", "messages")).toEqual([
    "messages/en.json must be a JSON object, but it is [].",
  ]);
});
