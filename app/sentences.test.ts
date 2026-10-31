import { expect, test } from "vitest";
import { countOf, listOfWords, singularOrPlural } from "./sentences";

test("joins one, two, and three words into an English list", () => {
  expect(listOfWords(["craft"])).toBe("craft");
  expect(listOfWords(["craft", "docs"])).toBe("craft and docs");
  expect(listOfWords(["craft", "docs", "product"])).toBe(
    "craft, docs, and product",
  );
});

test("joins words into a choice", () => {
  expect(listOfWords(["_title", "_body", "_label"], "disjunction")).toBe(
    "_title, _body, or _label",
  );
});

test("chooses the singular form only for a count of one", () => {
  expect(singularOrPlural(0, "lens", "lenses")).toBe("lenses");
  expect(singularOrPlural(1, "lens", "lenses")).toBe("lens");
  expect(singularOrPlural(2, "lens", "lenses")).toBe("lenses");
});

test("counts in the singular and the plural", () => {
  expect(countOf(1, "finding", "findings")).toBe("1 finding");
  expect(countOf(2, "finding", "findings")).toBe("2 findings");
});
