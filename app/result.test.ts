import { expect, test } from "vitest";
import { fail, failuresOf, succeed } from "./result";

test("collects the failure of every failed result in order", () => {
  expect(
    failuresOf([fail("PORT is wrong."), succeed(1), fail("--mode is wrong.")]),
  ).toEqual(["PORT is wrong.", "--mode is wrong."]);
});

test("collects nothing when every result succeeded", () => {
  expect(failuresOf([succeed(1), succeed("id")])).toEqual([]);
});
