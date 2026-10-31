import { expect, test } from "vitest";
import { parsePathArgument } from "./parse-path-argument.ts";

test("accepts a path and rejects a missing or empty argument", () => {
  expect(
    parsePathArgument(".github/review/route.schema.json", "The first argument"),
  ).toEqual({ ok: true, value: ".github/review/route.schema.json" });
  expect(parsePathArgument(undefined, "The first argument")).toEqual({
    ok: false,
    failure:
      "The first argument must be the path of a file, but it is missing.",
  });
  expect(parsePathArgument("", "The first argument")).toEqual({
    ok: false,
    failure: 'The first argument must be the path of a file, but it is "".',
  });
});
