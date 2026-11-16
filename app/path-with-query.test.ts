import { expect, test } from "vitest";
import { pathWithQuery } from "./path-with-query";

test("changes a view without losing its other query or fragment", () => {
  expect(
    pathWithQuery("/classes/1/stocks/BBCA/buy?range=1m&lots=2#price", {
      lots: "3",
      price: "4,980",
    }),
  ).toBe("/classes/1/stocks/BBCA/buy?range=1m&lots=3&price=4%2C980#price");
  expect(
    pathWithQuery("/classes/1/stocks/BBCA/buy?range=1m&placed=2", {
      placed: undefined,
    }),
  ).toBe("/classes/1/stocks/BBCA/buy?range=1m");
});

test("keeps a query-only link on the current page", () => {
  expect(pathWithQuery("?range=1m#chart", { lessonTask: "9" })).toBe(
    "?range=1m&lessonTask=9#chart",
  );
  expect(pathWithQuery("?placed=1#chart", { placed: undefined })).toBe(
    "?#chart",
  );
});
