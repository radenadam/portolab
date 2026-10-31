import { expect, test } from "vitest";
import { parseReturnPath } from "./parse-return-path";

test("accepts a path on this site", () => {
  expect(parseReturnPath("/portfolio?tab=risk", "returnTo")).toEqual({
    ok: true,
    value: "/portfolio?tab=risk",
  });
});

test("rejects a missing path and names the field", () => {
  expect(parseReturnPath(null, "returnTo")).toEqual({
    ok: false,
    failure: "returnTo is missing from the form.",
  });
});

test("rejects every path that could lead to another site", () => {
  for (const path of [
    "//example.com/phishing",
    "https://example.com",
    "/\\example.com",
  ]) {
    expect(parseReturnPath(path, "returnTo")).toEqual({
      ok: false,
      failure: `returnTo must be a path on this site, such as /prices, but it is "${path}".`,
    });
  }
});
