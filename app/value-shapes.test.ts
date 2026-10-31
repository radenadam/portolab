import { expect, test } from "vitest";
import { isRecord, isStringArray } from "./value-shapes";

test("accepts an object with fields and rejects null and lists", () => {
  expect(isRecord({ lens: "craft" })).toBe(true);
  expect(isRecord(null)).toBe(false);
  expect(isRecord(["craft"])).toBe(false);
});

test("accepts a list of strings and rejects a list with anything else", () => {
  expect(isStringArray(["craft", "docs"])).toBe(true);
  expect(isStringArray(["craft", 1])).toBe(false);
  expect(isStringArray("craft")).toBe(false);
});
