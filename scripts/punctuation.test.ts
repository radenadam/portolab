import { expect, test } from "vitest";
import { messageProblems, punctuationProblems } from "./punctuation.ts";

const emDash = "\u2014";

test("accepts a private field that ends with a semicolon in TypeScript", () => {
  expect(
    punctuationProblems("a.ts", "class A {\n  #count = 0;\n}", "typescript"),
  ).toEqual([]);
});

test("accepts semicolons in TypeScript code outside comments", () => {
  expect(
    punctuationProblems("a.ts", 'const cookie = "id=1; Path=/";', "typescript"),
  ).toEqual([]);
});

test("rejects a semicolon in a TypeScript comment", () => {
  expect(
    punctuationProblems("a.ts", "// It runs; then it stops.", "typescript"),
  ).toEqual([
    "a.ts:1: replace the semicolon with a connecting word or a new sentence.",
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

test("rejects a semicolon in a workflow comment and accepts one in a command", () => {
  expect(
    punctuationProblems(
      "review.yml",
      "# It runs; then it stops.\nrun: echo a; echo b",
      "workflow",
    ),
  ).toEqual([
    "review.yml:1: replace the semicolon with a connecting word or a new sentence.",
  ]);
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
  ).toEqual([
    "a.md:1: replace the semicolon with a connecting word or a new sentence.",
  ]);
});

test("rejects a dash in a message and names its key", () => {
  expect(
    messageProblems("messages/en.json", { app_name: `Porto ${emDash} lab` }),
  ).toEqual([
    "messages/en.json (app_name): replace the em dash with a connecting word or a new sentence.",
  ]);
});
