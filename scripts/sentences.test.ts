import { expect, test } from "vitest";
import { countOf, listOfWords } from "./sentences.ts";

test("joins one, two, and three words into an English list", () => {
  expect(listOfWords(["craft"])).toBe("craft");
  expect(listOfWords(["craft", "docs"])).toBe("craft and docs");
  expect(listOfWords(["craft", "docs", "product"])).toBe(
    "craft, docs, and product",
  );
});

test("counts in the singular and the plural", () => {
  expect(countOf(1, "finding", "findings")).toBe("1 finding");
  expect(countOf(2, "finding", "findings")).toBe("2 findings");
});
