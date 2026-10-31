import { expect, test } from "vitest";
import { safeReturnPath } from "./safe-return-path";

test("keeps a path on this site", () => {
  expect(safeReturnPath("/portfolio?tab=risk")).toBe("/portfolio?tab=risk");
});

test("sends a missing path to the home page", () => {
  expect(safeReturnPath(null)).toBe("/");
});

test("sends a path to another site to the home page", () => {
  expect(safeReturnPath("//example.com/phishing")).toBe("/");
  expect(safeReturnPath("https://example.com")).toBe("/");
  expect(safeReturnPath("/\\example.com")).toBe("/");
});
