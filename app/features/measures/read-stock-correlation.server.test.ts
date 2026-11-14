import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
  cashValuationForTest,
  ammnValuationForTest,
} from "./measures-for-test.server";
import { readStockCorrelation } from "./read-stock-correlation.server";

test("measures a held stock over the common months of the stock and its portfolio", () => {
  const result = successValueForTest(
    readStockCorrelation(
      databaseWithClosesForTest(),
      "BBCA",
      valuationForTest(["BBCA", "TLKM"]),
    ),
    "The portfolio has measures",
  );
  expect(result.months).toEqual({
    count: 60,
    first: "2021-10-29",
    last: "2026-09-30",
  });
  // Python's decimal module computed this correlation from the recorded monthly returns and weights of 50%, 30%, and 20% cash.
  expect(result.correlation.value).toBeCloseTo(0.8984914660690569, 14);
});

test("measures a stock not held over the shorter history shared with the portfolio", () => {
  const result = successValueForTest(
    readStockCorrelation(
      databaseWithClosesForTest(),
      "BBCA",
      ammnValuationForTest(),
    ),
    "AMMN and BBCA share enough months",
  );
  expect(result.months.count).toBe(38);
  // The one risky holding makes the correlation equal to the BBCA and AMMN correlation that Python's decimal module computed in measure-portfolio.test.ts.
  expect(result.correlation.value).toBeCloseTo(0.19992063495978923, 14);
});

test("keeps no holdings, missing quotes, and too few shared returns as distinct failures", () => {
  const database = databaseWithClosesForTest();
  expect(
    readStockCorrelation(database, "BBCA", cashValuationForTest()),
  ).toEqual({ ok: false, failure: { kind: "noHoldings" } });
  expect(
    readStockCorrelation(database, "BBCA", valuationForTest(["BBCA"])),
  ).toEqual({ ok: false, failure: { kind: "unpriced", codes: ["TLKM"] } });
  const result = readStockCorrelation(
    database,
    "AADI",
    valuationForTest(["BBCA", "TLKM"]),
  );
  expect(result).toMatchObject({
    ok: false,
    failure: {
      kind: "unmeasured",
      failure: { kind: "tooFewReturns", count: 21, minimum: 24 },
    },
  });
});
