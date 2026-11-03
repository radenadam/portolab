import { expect, test } from "vitest";
import { fieldMaximumLength } from "./form-size";
import { parseReturnPath } from "./parse-return-path";

const siteOrigin = "http://localhost:3000";

test("accepts a path on this site with its query and fragment", () => {
  expect(
    parseReturnPath("/portfolio?tab=risk#beta", "returnTo", siteOrigin),
  ).toEqual({ ok: true, value: "/portfolio?tab=risk#beta" });
});

test("accepts a path of the most characters that the field takes", () => {
  const path = `/${"a".repeat(fieldMaximumLength - 1)}`;
  expect(parseReturnPath(path, "returnTo", siteOrigin)).toEqual({
    ok: true,
    value: path,
  });
});

test("rejects a path longer than the field takes, just past the maximum or far past it, and names both lengths", () => {
  for (const [length, failure] of [
    [
      fieldMaximumLength + 1,
      "returnTo must be a path on this site, such as /prices, but it has 8001 characters, far more than any field takes.",
    ],
    [
      1_000_000,
      "returnTo must be a path on this site, such as /prices, but it has 1000000 characters, far more than any field takes.",
    ],
  ] as const) {
    expect(
      parseReturnPath(`/${"a".repeat(length - 1)}`, "returnTo", siteOrigin),
    ).toEqual({ ok: false, failure });
  }
});

test("rejects a missing path and names the field", () => {
  expect(parseReturnPath(null, "returnTo", siteOrigin)).toEqual({
    ok: false,
    failure:
      "returnTo must be a path on this site, such as /prices, but it is missing.",
  });
});

test("rejects a field that holds a file instead of text and names its type", () => {
  expect(
    parseReturnPath(new File([], "return.txt"), "returnTo", siteOrigin),
  ).toEqual({
    ok: false,
    failure:
      "returnTo must be a path on this site, such as /prices, but it is a value of type File.",
  });
});

test("rejects every value that a browser would resolve to another site", () => {
  for (const value of [
    "//example.com/phishing",
    "https://example.com",
    "/\\example.com",
    "/\t/example.com",
    "/\n/example.com",
    "javascript:alert(1)",
    "/.//example.com",
    "/..//example.com",
    "/a/..//example.com",
    "/%2e//example.com",
  ]) {
    expect(parseReturnPath(value, "returnTo", siteOrigin), value).toEqual({
      ok: false,
      failure: `returnTo must be a path on this site, such as /prices, but it is ${JSON.stringify(value)}.`,
    });
  }
});
