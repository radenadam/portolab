import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { parseClassMapAxis } from "./parse-class-map-axis";

test("reads either risk axis and defaults to beta only when the address leaves it out", () => {
  expect(parseClassMapAxis(null, "axis")).toEqual({ ok: true, value: "beta" });
  expect(parseClassMapAxis("beta", "axis")).toEqual({
    ok: true,
    value: "beta",
  });
  expect(parseClassMapAxis("deviation", "axis")).toEqual({
    ok: true,
    value: "deviation",
  });
  expect(parseClassMapAxis("other", "axis")).toEqual({
    ok: false,
    failure: 'axis must be "beta" or "deviation", but it is "other".',
  });
});

test("quotes an unknown axis at the field maximum and rejects longer values by their length", () => {
  const longest = "a".repeat(fieldMaximumLength);
  expect(parseClassMapAxis(longest, "axis")).toEqual({
    ok: false,
    failure: `axis must be "beta" or "deviation", but it is "${longest}".`,
  });
  for (const length of [fieldMaximumLength + 1, 1_000_000]) {
    expect(parseClassMapAxis("a".repeat(length), "axis")).toEqual({
      ok: false,
      failure: `axis must be "beta" or "deviation", but it has ${String(length)} characters, far more than any field takes.`,
    });
  }
});
