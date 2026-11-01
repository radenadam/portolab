import { expect, test } from "vitest";
import { orderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { checkCashForPurchase } from "./check-cash-for-purchase";
import { costRatesForTest } from "./rules-for-test";

// The amounts were computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP. So 5 lots at Rp4,980 cost Rp2,490,000 with a fee of Rp3,735, which is Rp2,493,735, and 4 lots cost Rp1,994,988.

const rates = costRatesForTest("2026-11-02");

const purchase = {
  code: "BBCA",
  lots: orderLots(5),
  shares: shares(500),
  price: rupiah(4_980),
};

test("gives the value and the fee of a purchase that the cash pays for, to the last rupiah", () => {
  expect(checkCashForPurchase(purchase, rupiah(2_493_735), rates)).toEqual({
    ok: true,
    value: { value: 2_490_000, fee: 3_735 },
  });
});

test("fails for a purchase that the cash does not pay for, with the amounts and the largest order that it pays for", () => {
  expect(checkCashForPurchase(purchase, rupiah(2_493_734), rates)).toEqual({
    ok: false,
    failure: {
      code: "BBCA",
      lots: 5,
      price: 4_980,
      value: 2_490_000,
      fee: 3_735,
      availableCash: 2_493_734,
      largestLots: 4,
    },
  });
});
