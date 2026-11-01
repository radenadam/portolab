import { expect, test } from "vitest";
import { parseChoice, parseFilePath } from "./value-parsers";

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
