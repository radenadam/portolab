import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import {
  parseJsonObject,
  parseJsonWith,
  parseListField,
  parseStringsAt,
  readJsonFile,
} from "./json.ts";
import type { Parser } from "./json.ts";

// Accepts any JSON content, so a test sees what parseJsonWith does with the text itself.
const acceptAnyContent: Parser<unknown> = (value) => succeed(value);

test("keeps the parser's reason when the text is not valid JSON", () => {
  const result = parseJsonWith("{bad", "PANEL_RESULTS", acceptAnyContent);
  expect(result.ok).toBe(false);
  expect(result.ok ? "" : result.failure).toMatch(
    /^PANEL_RESULTS must be valid JSON, but it is not\. The parser reported: \S/,
  );
});

test("reads valid JSON", () => {
  expect(
    parseJsonWith('{"lens":"craft"}', "findings-craft.json", acceptAnyContent),
  ).toEqual({
    ok: true,
    value: { lens: "craft" },
  });
});

test("names the file as the source when its content fails to parse", () => {
  expect(
    readJsonFile("package.json", (_value, source) => fail(`${source} failed.`)),
  ).toEqual({ ok: false, failure: "package.json failed." });
});

test("fails when an environment variable that should hold JSON is empty or not set", () => {
  expect(parseJsonWith(undefined, "PANEL_RESULTS", acceptAnyContent)).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is missing.",
  });
  expect(parseJsonWith("", "PANEL_RESULTS", acceptAnyContent)).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is empty.",
  });
});

test("rejects a value that is not text and describes it", () => {
  expect(parseJsonWith(42, "PANEL_RESULTS", acceptAnyContent)).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is 42.",
  });
  expect(parseJsonWith({}, "PANEL_RESULTS", acceptAnyContent)).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is {}.",
  });
  expect(parseJsonWith(null, "PANEL_RESULTS", acceptAnyContent)).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is null.",
  });
});

test("reads a JSON object and rejects a list", () => {
  expect(parseJsonObject({ app_name: "Portolab" }, "messages/en.json")).toEqual(
    { ok: true, value: { app_name: "Portolab" } },
  );
  expect(parseJsonObject(["app_name"], "messages/en.json")).toEqual({
    ok: false,
    failure: 'messages/en.json must be a JSON object, but it is ["app_name"].',
  });
});

test("reads each item of a list field and names the position of an item that fails", () => {
  const parseWord = (value: unknown, source: string): Result<string, string> =>
    typeof value === "string"
      ? succeed(value)
      : fail(`${source} is not a word.`);
  const list = { field: "words", itemName: "word", parseItem: parseWord };
  expect(parseListField({ words: ["a", "b"] }, "x.json", list)).toEqual({
    ok: true,
    value: ["a", "b"],
  });
  expect(parseListField({ words: ["a", 2] }, "x.json", list)).toEqual({
    ok: false,
    failure: "x.json: word 2 is not a word.",
  });
  expect(parseListField({}, "x.json", list)).toEqual({
    ok: false,
    failure: "x.json must have a list at words, but words is missing.",
  });
});

test("reads a list of strings at a path and names the path and the value when it fails", () => {
  expect(
    parseStringsAt({ lenses: [] }, "ROUTER_OUTPUT", {
      keys: ["lenses"],
      mayBeEmpty: true,
    }),
  ).toEqual({ ok: true, value: [] });
  expect(
    parseStringsAt({ locales: [] }, "settings.json", {
      keys: ["locales"],
      mayBeEmpty: false,
    }),
  ).toEqual({
    ok: false,
    failure:
      "settings.json must have a list of strings that is not empty at locales, but locales is [].",
  });
  expect(
    parseStringsAt({ lenses: "craft" }, "ROUTER_OUTPUT", {
      keys: ["lenses"],
      mayBeEmpty: true,
    }),
  ).toEqual({
    ok: false,
    failure:
      'ROUTER_OUTPUT must have a list of strings at lenses, but lenses is "craft".',
  });
  expect(
    parseStringsAt(7, "EXPECTED_LENSES", { keys: [], mayBeEmpty: true }),
  ).toEqual({
    ok: false,
    failure: "EXPECTED_LENSES must be a list of strings, but it is 7.",
  });
  expect(
    parseStringsAt([], "EXPECTED_LENSES", { keys: [], mayBeEmpty: false }),
  ).toEqual({
    ok: false,
    failure:
      "EXPECTED_LENSES must be a list of strings that is not empty, but it is [].",
  });
});
