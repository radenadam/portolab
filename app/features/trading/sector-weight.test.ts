import { expect, test } from "vitest";
import { portfolioWeight } from "~/units/portfolio-weight";
import { sectorWeight } from "./sector-weight";

test("adds every holding in the traded stock's IDX-IC sector and keeps cash outside every sector", () => {
  // Python Decimal of 0.25 and 0.15 gives 0.40 for Financials. Infrastructure has 0.20, while cash has the remaining 0.40.
  const holdings = [
    { code: "BBCA", weight: portfolioWeight(0.25) },
    { code: "BBNI", weight: portfolioWeight(0.15) },
    { code: "TLKM", weight: portfolioWeight(0.2) },
  ];
  expect(sectorWeight(holdings, "BBCA")).toBe(0.4);
  expect(sectorWeight(holdings, "BBRI")).toBe(0.4);
  expect(sectorWeight(holdings, "TLKM")).toBe(0.2);
  expect(sectorWeight(holdings, "AMMN")).toBe(0);
  expect(sectorWeight([], "BBCA")).toBe(0);
});
