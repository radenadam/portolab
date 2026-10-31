import { expect, test } from "vitest";
import { fail } from "../app/result.ts";
import { parseJsonText, readJsonFile } from "./json.ts";

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

test("rejects a value that is not text", () => {
  expect(parseJsonText(42, "PANEL_RESULTS")).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must be JSON text, but it is a number.",
  });
});
