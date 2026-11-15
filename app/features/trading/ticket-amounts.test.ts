import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { ticketAmounts } from "./ticket-amounts";
import { mondayTradingDayForTest } from "./orders-for-test";

// Python Decimal with ROUND_HALF_UP gives these independent values, including the half-rupiah fee in the reference screen.
test("estimates the value, fee, tax, total, and remaining available cash independently for a purchase and sale", () => {
  const rates = mondayTradingDayForTest.rates;
  expect(
    ticketAmounts("buy", {
      price: rupiah(9_350),
      shares: shares(100),
      rates,
      available: rupiah(14_432_637),
    }),
  ).toEqual({
    value: 935_000,
    fee: 1_403,
    tax: 0,
    total: 936_403,
    after: 13_496_234,
  });
  expect(
    ticketAmounts("sell", {
      price: rupiah(4_980),
      shares: shares(500),
      rates,
      available: rupiah(100_000_000),
    }),
  ).toEqual({
    value: 2_490_000,
    fee: 3_735,
    tax: 2_490,
    total: 2_483_775,
    after: 102_483_775,
  });
});
