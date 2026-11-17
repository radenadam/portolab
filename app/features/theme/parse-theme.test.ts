import { expect, test } from "vitest";
import { parseTheme } from "./parse-theme";
import { themes } from "./theme";

test("accepts every stored theme and rejects malformed cookie values with their source", () => {
  for (const theme of themes)
    expect(parseTheme(theme, "Cookie")).toEqual({ ok: true, value: theme });
  for (const [value, actual] of [
    [null, "null"],
    [undefined, "missing"],
    ["sepia", '"sepia"'],
    [{ theme: "dark" }, '{"theme":"dark"}'],
  ] as const) {
    expect(parseTheme(value, "Cookie")).toEqual({
      ok: false,
      failure: `Cookie must be one of ["system","light","dark"], but it is ${actual}.`,
    });
  }
});

test("describes a document attribute modified to contain a large value by its length", () => {
  expect(parseTheme("a".repeat(1_000_000), "html[data-theme]")).toEqual({
    ok: false,
    failure:
      'html[data-theme] must be one of ["system","light","dark"], but it is text with 1000000 characters.',
  });
});
