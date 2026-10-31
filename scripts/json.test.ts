import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import {
  parseJsonObject,
  parseJsonText,
  parseListField,
  parseStringsAt,
  readJsonFile,
} from "./json.ts";

test("keeps the parser's reason when the text is not valid JSON", () => {
  const result = parseJsonText("{bad", "PANEL_RESULTS");
  expect(result.ok).toBe(false);
  expect(result.ok ? "" : result.failure).toMatch(
    /^PANEL_RESULTS is not valid JSON\. The parser reported: \S/,
  );
});

test("reads valid JSON", () => {
  expect(parseJsonText('{"lens":"craft"}', "findings-craft.json")).toEqual({
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
  const expected = {
    ok: false,
    failure: "PANEL_RESULTS is empty or not set, so it holds no JSON.",
  };
  expect(parseJsonText(undefined, "PANEL_RESULTS")).toEqual(expected);
  expect(parseJsonText("", "PANEL_RESULTS")).toEqual(expected);
});

test("rejects a value that is not text and describes it", () => {
  expect(parseJsonText(42, "PANEL_RESULTS")).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is 42.",
  });
  expect(parseJsonText({}, "PANEL_RESULTS")).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is {}.",
  });
  expect(parseJsonText(null, "PANEL_RESULTS")).toEqual({
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
    failure: "messages/en.json is not a JSON object.",
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
    failure: 'x.json has no valid "words".',
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
