import { expect, test } from "vitest";
import { parseReturnPath } from "./parse-return-path";

const siteOrigin = "http://localhost:3000";

test("accepts a path on this site with its query and fragment", () => {
  expect(
    parseReturnPath("/portfolio?tab=risk#beta", "returnTo", siteOrigin),
  ).toEqual({ ok: true, value: "/portfolio?tab=risk#beta" });
});

test("rejects a missing path and names the field", () => {
  expect(parseReturnPath(null, "returnTo", siteOrigin)).toEqual({
    ok: false,
    failure: "returnTo is missing from the form.",
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
      failure: `returnTo must be a path on this site, such as /prices, but it is "${value}".`,
    });
  }
});
