import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { mondayTradingDayForTest } from "./orders-for-test";
import { ticketPriceStep } from "./ticket-price-step";

// The expected prices were computed by hand from the dated IDX tick table in idx-rules-on.ts, without the step function.
test("steps across every IDX tick boundary and rounds an off-tick draft toward the chosen direction", () => {
  for (const [price, below, above] of [
    [1, 1, 2],
    [199, 198, 200],
    [200, 199, 202],
    [499, 498, 500],
    [500, 498, 505],
    [2000, 1995, 2010],
    [5000, 4990, 5025],
    [4999, 4990, 5000],
  ]) {
    if (price === undefined || below === undefined || above === undefined)
      throw new Error("Each case has a price and both steps.");
    const rules = mondayTradingDayForTest.rules;
    expect(ticketPriceStep(rupiah(price), -1, rules)).toBe(below);
    expect(ticketPriceStep(rupiah(price), 1, rules)).toBe(above);
  }
});
