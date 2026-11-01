import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { holdingAfterFill } from "./holding-after-fill";
import type { Holding } from "./holding-after-fill";
import type { Fill, OrderSide } from "./order";

// The fills and the costs were computed with the decimal module of Python, with a broker fee of 0.15% and a tax of 0.1% of the value, each rounded to a whole rupiah with ROUND_HALF_UP, and the cost of the shares of a sale as the cost of the holding times the shares sold over the shares held, rounded the same way.

function filled(
  amounts: Pick<Fill, "price" | "value" | "fee" | "tax" | "cashChange">,
): Fill {
  return {
    ...amounts,
    quotedAt: new Date("2026-11-02T02:50:00Z"),
    filledAt: new Date("2026-11-02T03:00:00Z"),
  };
}

function after(
  holding: Holding | undefined,
  order: { side: OrderSide; shares: number },
  fill: Fill,
): ReturnType<typeof holdingAfterFill> {
  return holdingAfterFill(
    holding,
    { code: "BBCA", side: order.side, shares: shares(order.shares) },
    fill,
  );
}

test("adds the shares of a purchase and its value with the fee to the cost of a holding, which starts empty", () => {
  // 5 lots at Rp4,980.
  const first = after(
    undefined,
    { side: "buy", shares: 500 },
    filled({
      price: rupiah(4_980),
      value: rupiah(2_490_000),
      fee: rupiah(3_735),
      tax: rupiah(0),
      cashChange: rupiah(-2_493_735),
    }),
  );
  expect(first).toEqual({
    holding: { code: "BBCA", shares: 500, cost: 2_493_735 },
    soldCost: 0,
  });
  // 3 lots at Rp5,000.
  expect(
    after(
      first.holding,
      { side: "buy", shares: 300 },
      filled({
        price: rupiah(5_000),
        value: rupiah(1_500_000),
        fee: rupiah(2_250),
        tax: rupiah(0),
        cashChange: rupiah(-1_502_250),
      }),
    ),
  ).toEqual({
    holding: { code: "BBCA", shares: 800, cost: 3_995_985 },
    soldCost: 0,
  });
});

test("takes the average cost of the shares of a sale out of a holding, rounded to a whole rupiah", () => {
  // 3 of 8 lots at Rp5,100. Their cost is 3,995,985 × 300 / 800, which is 1,498,494.375.
  const holding = {
    code: "BBCA",
    shares: shares(800),
    cost: rupiah(3_995_985),
  };
  const sold = after(
    holding,
    { side: "sell", shares: 300 },
    filled({
      price: rupiah(5_100),
      value: rupiah(1_530_000),
      fee: rupiah(2_295),
      tax: rupiah(1_530),
      cashChange: rupiah(1_526_175),
    }),
  );
  expect(sold).toEqual({
    holding: { code: "BBCA", shares: 500, cost: 2_497_491 },
    soldCost: 1_498_494,
  });
  // The other 5 lots at Rp5,050 take out the rest of the cost.
  expect(
    after(
      sold.holding,
      { side: "sell", shares: 500 },
      filled({
        price: rupiah(5_050),
        value: rupiah(2_525_000),
        fee: rupiah(3_788),
        tax: rupiah(2_525),
        cashChange: rupiah(2_518_687),
      }),
    ),
  ).toEqual({
    holding: { code: "BBCA", shares: 0, cost: 0 },
    soldCost: 2_497_491,
  });
});
