import { expect, test } from "vitest";
import { describeValue, isRecord, isStringArray } from "./value-shapes";

test("describes a missing value as missing and any other value as JSON", () => {
  expect(describeValue(undefined)).toBe("missing");
  expect(describeValue("develop")).toBe('"develop"');
  expect(describeValue(["craft"])).toBe('["craft"]');
  expect(describeValue(null)).toBe("null");
});

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
