import { expect, test } from "vitest";
import { parseJsonText } from "./json.ts";

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
