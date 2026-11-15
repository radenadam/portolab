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
