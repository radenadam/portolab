import { expect, test } from "vitest";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { mondayTradingDayForTest } from "./orders-for-test";
import { ticketQuickLots } from "./ticket-quick-lots";

// Python Decimal with ROUND_HALF_UP gives costs of 2809208 for 3 lots, 6554818 for 7 lots, and 14046038 for 15 lots at Rp9350. One more lot exceeds each cash share.
test("sizes each chip from its share of the budget before applying the exchange cap", () => {
  const budget = {
    available: rupiah(14_432_637),
    free: lots(30),
    price: rupiah(9_350),
    day: mondayTradingDayForTest,
  };
  for (const [fraction, buy, sell] of [
    [0.25, 3, 7],
    [0.5, 7, 15],
    [1, 15, 30],
  ] as const) {
    expect(ticketQuickLots("buy", fraction, budget)).toBe(buy);
    expect(ticketQuickLots("sell", fraction, budget)).toBe(sell);
  }
  const large = {
    ...budget,
    available: rupiah(1_000_000_000_000),
    free: lots(1_000_000),
  };
  expect(ticketQuickLots("buy", 0.25, large)).toBe(50_000);
  expect(ticketQuickLots("sell", 0.25, large)).toBe(50_000);
});
