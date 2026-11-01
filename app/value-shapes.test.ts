import { expect, test } from "vitest";
import {
  describeValue,
  isRecord,
  isStringArray,
  typeName,
} from "./value-shapes";

test("describes a missing value as missing and any other value as JSON", () => {
  expect(describeValue(undefined)).toBe("missing");
  expect(describeValue("")).toBe("empty");
  expect(describeValue("develop")).toBe('"develop"');
  expect(describeValue(["craft"])).toBe('["craft"]');
  expect(describeValue(null)).toBe("null");
  expect(describeValue({ lens: "craft" })).toBe('{"lens":"craft"}');
});

test("describes a number as its text, because JSON shows Infinity and NaN as null", () => {
  expect(describeValue(4980.5)).toBe("4980.5");
  expect(describeValue(-4980)).toBe("-4980");
  expect(describeValue(Number.POSITIVE_INFINITY)).toBe("Infinity");
  expect(describeValue(Number.NaN)).toBe("NaN");
});

test("describes a date that holds no time as an invalid date", () => {
  expect(describeValue(new Date("not a date"))).toBe("an invalid date");
});

test("names a value that JSON cannot show by its class", () => {
  expect(describeValue(new File([], "return.txt"))).toBe(
    "a value of type File",
  );
});

test("names the type of a value by its class or by typeof", () => {
  expect(typeName(new File([], "locale.txt"))).toBe("File");
  expect(typeName(7)).toBe("number");
  expect(typeName({ lens: "craft" })).toBe("object");
});

test("describes an object without a prototype as JSON instead of failing", () => {
  const record: unknown = Object.assign(Object.create(null), { lens: "craft" });
  expect(describeValue(record)).toBe('{"lens":"craft"}');
  expect(typeName(record)).toBe("object");
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

test("describes an object whose prototype has no constructor as JSON", () => {
  const prototype: object = {};
  Object.setPrototypeOf(prototype, null);
  const record: unknown = Object.create(prototype);
  expect(describeValue(record)).toBe("{}");
  expect(typeName(record)).toBe("object");
});
