import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "./stock-path";

test("addresses the stock and both ticket sides under the same class workspace", () => {
  const classId = 7 as ClassId;
  expect(stockPath(classId, "BBCA")).toBe("/classes/7/stocks/BBCA");
  expect(stockPath(classId, "BBCA", "buy")).toBe("/classes/7/stocks/BBCA/buy");
  expect(stockPath(classId, "BBCA", "sell")).toBe(
    "/classes/7/stocks/BBCA/sell",
  );
});
