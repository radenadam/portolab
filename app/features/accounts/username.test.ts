import { expect, test } from "vitest";
import { parseUsername } from "./username";

test("reads a username in lowercase, without the spaces around it", () => {
  expect(parseUsername("  Budi.Santoso_2 ", "--username")).toEqual({
    ok: true,
    value: "budi.santoso_2",
  });
  expect(parseUsername("abc", "--username")).toEqual({
    ok: true,
    value: "abc",
  });
  expect(parseUsername("a".repeat(32), "--username")).toEqual({
    ok: true,
    value: "a".repeat(32),
  });
});

test("rejects a username that is too short, too long, or has other characters, and names what it is", () => {
  for (const value of [
    "ab",
    "a".repeat(33),
    "budi santoso",
    "budi@kampus",
    "bùdi",
  ]) {
    expect(parseUsername(value, "--username")).toEqual({
      ok: false,
      failure: `--username must be 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_", but it is ${JSON.stringify(value)}.`,
    });
  }
  expect(parseUsername(undefined, "--username")).toEqual({
    ok: false,
    failure:
      '--username must be 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_", but it is missing.',
  });
});
