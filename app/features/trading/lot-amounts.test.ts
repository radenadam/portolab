import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { mondayTradingDayForTest } from "./orders-for-test";
import { lotAmounts } from "./lot-amounts";

test("quotes one lot with the same whole-rupiah rounding as the ticket", () => {
  // Python Decimal with ROUND_HALF_UP gives these values for 100 shares, a 0.15% fee, and 0.1% sales tax. At 595 the tax is 59.5, which rounds up to 60.
  for (const [price, value, fee, tax, buy, sell] of [
    [1, 100, 0, 0, 100, 100],
    [595, 59500, 89, 60, 59589, 59351],
    [4980, 498000, 747, 498, 498747, 496755],
    [30000, 3000000, 4500, 3000, 3004500, 2992500],
  ] as const) {
    const amounts = lotAmounts(rupiah(price), mondayTradingDayForTest);
    expect(amounts.shares).toBe(100);
    expect(amounts.buy).toEqual({
      value,
      fee,
      tax: 0,
      total: buy,
      after: -buy,
    });
    expect(amounts.sell).toEqual({ value, fee, tax, total: sell, after: sell });
  }
});
