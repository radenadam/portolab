import { expect, test } from "vitest";
import { readTextFile } from "./read-text-file.ts";

test("reads a text file", () => {
  const text = readTextFile("LICENSE");
  expect(text.ok && text.value.startsWith("MIT License")).toBe(true);
});

test("reports a file that cannot be read and names it", () => {
  const text = readTextFile("scripts/missing.json");
  expect(text.ok ? "" : text.failure).toMatch(
    /^scripts\/missing\.json cannot be read\. The system reported: /,
  );
});
