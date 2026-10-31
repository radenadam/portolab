import { expect, test } from "vitest";
import { fail } from "../app/result.ts";
import { parseJsonText, readJsonFile, readTextFile } from "./json.ts";

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

test("reports a file that cannot be read and names it", () => {
  const text = readTextFile("scripts/missing.json");
  expect(text.ok ? "" : text.failure).toMatch(
    /^scripts\/missing\.json cannot be read\. The system reported: /,
  );
});

test("names the file as the source when its content fails to parse", () => {
  expect(
    readJsonFile("package.json", (_value, source) => fail(`${source} failed.`)),
  ).toEqual({ ok: false, failure: "package.json failed." });
});
