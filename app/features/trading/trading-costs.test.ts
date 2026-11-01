import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { costRatesOn, tradeCosts } from "./trading-costs";
import { costRatesForTest } from "./rules-for-test";

const november = costRatesForTest("2026-11-02");

// The expected costs were computed with the decimal module of Python, as 0.15% of the value for the broker fee and 0.1% for the tax, each rounded to a whole rupiah with ROUND_HALF_UP. The comment of each trade gives the costs before rounding.
const trades: {
  name: string;
  value: number;
  buyFee: number;
  sellFee: number;
  tax: number;
}[] = [
  // 5 lots at Rp4,980: a fee of 3,735 and a tax of 2,490.
  {
    name: "of whole rupiah",
    value: 2_490_000,
    buyFee: 3_735,
    sellFee: 3_735,
    tax: 2_490,
  },
  // 1 lot at Rp30: a fee of 4.50 and a tax of 3.
  {
    name: "with a fee of half a rupiah",
    value: 3_000,
    buyFee: 5,
    sellFee: 5,
    tax: 3,
  },
  // 1 lot at Rp15: a fee of 2.25 and a tax of 1.50.
  {
    name: "with a tax of half a rupiah",
    value: 1_500,
    buyFee: 2,
    sellFee: 2,
    tax: 2,
  },
  // 50,000 lots at Rp24,900, the largest order of the most expensive stock of the LQ45 on 30 October 2026.
  {
    name: "of the largest order",
    value: 124_500_000_000,
    buyFee: 186_750_000,
    sellFee: 186_750_000,
    tax: 124_500_000,
  },
];

for (const { name, value, buyFee, sellFee, tax } of trades) {
  test(`charges a purchase the broker fee and a sale the fee and the tax on a value ${name}`, () => {
    expect(tradeCosts("buy", rupiah(value), november)).toEqual({
      fee: buyFee,
      tax: 0,
    });
    expect(tradeCosts("sell", rupiah(value), november)).toEqual({
      fee: sellFee,
      tax,
    });
  });
}

test("fails for a date that the fees have no record for, and names each missing rate", () => {
  expect(costRatesOn("2026-10-30")).toEqual({
    ok: false,
    failure:
      "No record of the broker fee covers 2026-10-30, so add the rates for that day to trading-costs.ts.",
  });
  expect(costRatesOn("1997-05-28")).toEqual({
    ok: false,
    failure:
      "No record of the broker fee and the final tax on sales covers 1997-05-28, so add the rates for that day to trading-costs.ts.",
  });
});
