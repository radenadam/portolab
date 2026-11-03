import { expect, test } from "vitest";
import { fieldMaximumLength } from "./form-size";
import { parseChoice, parseFilePath, parseRecordId } from "./value-parsers";

test("accepts one of the choices and names them all when the value is another", () => {
  expect(parseChoice("yahoo", "PRICE_SOURCE", ["yahoo", "fixture"])).toEqual({
    ok: true,
    value: "yahoo",
  });
  expect(parseChoice("google", "PRICE_SOURCE", ["yahoo", "fixture"])).toEqual({
    ok: false,
    failure: 'PRICE_SOURCE must be "yahoo" or "fixture", but it is "google".',
  });
  expect(
    parseChoice(undefined, "--mode", ["development", "production", "test"]),
  ).toEqual({
    ok: false,
    failure:
      '--mode must be "development", "production", or "test", but it is missing.',
  });
});

test("accepts a path and rejects a missing or empty one", () => {
  expect(parseFilePath("data/portolab.sqlite", "DATABASE_PATH")).toEqual({
    ok: true,
    value: "data/portolab.sqlite",
  });
  expect(parseFilePath(undefined, "The first argument")).toEqual({
    ok: false,
    failure:
      "The first argument must be the path of a file, but it is missing.",
  });
  expect(parseFilePath("", "DATABASE_PATH")).toEqual({
    ok: false,
    failure: "DATABASE_PATH must be the path of a file, but it is empty.",
  });
});

test("reads the id of a row and quotes any other value up to the maximum of any field", () => {
  expect(parseRecordId("42", "classId")).toEqual({ ok: true, value: 42 });
  for (const value of ["0", "abc", "a".repeat(fieldMaximumLength)]) {
    expect(parseRecordId(value, "classId"), value.slice(0, 10)).toEqual({
      ok: false,
      failure: `classId must be a positive whole number, but it is "${value}".`,
    });
  }
});

test("rejects a value past the maximum of any field, just or far, by its length without quoting it", () => {
  for (const length of [fieldMaximumLength + 1, 1_000_000]) {
    expect(parseRecordId("a".repeat(length), "classId")).toEqual({
      ok: false,
      failure: `classId must have at most 8000 characters, but it has ${String(length)}.`,
    });
  }
});
