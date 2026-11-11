import { expect, test } from "vitest";
import { lots } from "~/units/lots";
import { lotsStepOf } from "./lots-step";
import type { OrderFailure } from "./order";
import { purchaseWithCashSetAsideForTest } from "./purchase-with-cash-set-aside-for-test";
import { orderLotsForTest } from "./orders-for-test";

/** A sale of 3 lots of BBCA by an account that holds some lots, of which open sell orders set aside some. */
function saleOfThreeLots(heldLots: number, setAsideLots: number): OrderFailure {
  return {
    kind: "notEnoughShares",
    code: "BBCA",
    lots: orderLotsForTest(3),
    heldLots: lots(heldLots),
    setAside: { amount: lots(setAsideLots), orders: setAsideLots > 0 ? 1 : 0 },
  };
}

test("offers the largest purchase that the available cash pays for, and no step when it pays for no lot", () => {
  expect(lotsStepOf(purchaseWithCashSetAsideForTest)).toBe(4);
  expect(
    lotsStepOf({ ...purchaseWithCashSetAsideForTest, largestLots: lots(0) }),
  ).toBeUndefined();
});

test("offers the lots that no other open sell order sets aside, and no step when there are none", () => {
  expect(lotsStepOf(saleOfThreeLots(5, 3))).toBe(2);
  expect(lotsStepOf(saleOfThreeLots(1, 1))).toBeUndefined();
  expect(lotsStepOf(saleOfThreeLots(0, 0))).toBeUndefined();
});

test("offers no step for a rejection that no number of lots answers", () => {
  expect(lotsStepOf({ kind: "noPrice", code: "BBCA" })).toBeUndefined();
});
