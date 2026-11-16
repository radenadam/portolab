import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { databaseWithClosesForTest } from "~/features/measures/measures-for-test.server";
import { readLessonExample } from "./read-lesson-example.server";

test("weighs eligible example stocks and cash equally over their shared months", () => {
  const example = readLessonExample(databaseWithClosesForTest());
  expect(example).toBeDefined();
  if (example === undefined)
    throw new Error("The recorded stocks have enough shared months.");
  // By hand, the three eligible stocks and cash each have an example value of one rupiah, so the total is four and each weight is a quarter. AADI has too few returns and the other tracked stocks have no history in this fixture.
  expect(
    example.holdings.map((holding) => ({
      code: holding.code,
      value: holding.value,
      weight: holding.weight,
    })),
  ).toEqual([
    { code: "AMMN", value: 1, weight: 0.25 },
    { code: "BBCA", value: 1, weight: 0.25 },
    { code: "TLKM", value: 1, weight: 0.25 },
  ]);
  expect(example.totalValue).toBe(4);
  expect(example.cash).toEqual({ value: 1, weight: 0.25 });
  expect(example.market.returns).toHaveLength(38);
  // Python Decimal used the shared-period means recorded in measure-portfolio.test.ts at a quarter each.
  expect(example.expectedReturn).toBeCloseTo(0.002362651862241753, 16);
});

test("offers no example without usable stored stock history", () => {
  expect(readLessonExample(openDatabaseForTest())).toBeUndefined();
});
