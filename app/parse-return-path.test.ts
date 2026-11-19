import { expect, test } from "vitest";
import { returnPathMaximumLength } from "./form-size";
import { parseReturnPath } from "./parse-return-path";

const siteOrigin = "http://localhost:3000";

test("accepts a path on this site with its query and fragment", () => {
  expect(
    parseReturnPath("/portfolio?tab=risk#beta", "returnTo", siteOrigin),
  ).toEqual({ ok: true, value: "/portfolio?tab=risk#beta" });
});

test("accepts a path of the most characters that the field takes", () => {
  const path = `/${"a".repeat(returnPathMaximumLength - 1)}`;
  expect(parseReturnPath(path, "returnTo", siteOrigin)).toEqual({
    ok: true,
    value: path,
  });
});

test("rejects a path longer than its field takes, just past the maximum or far past it, and names both lengths", () => {
  for (const [length, failure] of [
    [
      returnPathMaximumLength + 1,
      "returnTo must be a path on this site of at most 128000 characters, but it has 128001.",
    ],
    [
      1_000_000,
      "returnTo must be a path on this site of at most 128000 characters, but it has 1000000.",
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
      "returnTo must be a path on this site, such as /sign-in, but it is missing.",
  });
});

test("rejects a field that holds a file instead of text and names its type", () => {
  expect(
    parseReturnPath(new File([], "return.txt"), "returnTo", siteOrigin),
  ).toEqual({
    ok: false,
    failure:
      "returnTo must be a path on this site, such as /sign-in, but it is a value of type File.",
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
      failure: `returnTo must be a path on this site, such as /sign-in, but it is ${JSON.stringify(value)}.`,
    });
  }
});

test("restricts a return to named pages while preserving its query and row fragment", () => {
  const allowed = ["/classes/7", "/classes/7/students"];
  const path = "/classes/7/students?measure=treynor&student=11#student-11";
  expect(
    parseReturnPath(path, "returnTo", {
      origin: siteOrigin,
      allowedPaths: allowed,
    }),
  ).toEqual({
    ok: true,
    value: path,
  });
  expect(
    parseReturnPath("/classes/8", "returnTo", {
      origin: siteOrigin,
      allowedPaths: allowed,
    }),
  ).toEqual({
    ok: false,
    failure:
      'returnTo must return to /classes/7 or /classes/7/students, but it is "/classes/8".',
  });
});
