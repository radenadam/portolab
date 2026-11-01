import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { acceptedPriceRange, checkLimitPrice } from "./accepted-prices";
import { oneRupiahLimit, rateLimit } from "./price-limits";
import type { PriceLimit } from "./price-limits";
import { idxRulesForTest } from "./rules-for-test";

// The expected prices were computed with the decimal module of Python from the limits and tick sizes in idx-rules-on.ts, by a search for the valid price nearest to each limit on the side of the reference price. The five ranges of 1 October 2026 match the examples of the calculator of auto rejection limits of Calcuid, which applies the same rules. The comment of each range gives the limits before rounding.
const ranges: {
  date: string;
  reference: number;
  lowest: number;
  highest: number;
  upper: PriceLimit;
  lower: PriceLimit;
}[] = [
  // From 2 to 0, which is below the minimum price of Rp1.
  {
    date: "2026-10-01",
    reference: 1,
    lowest: 1,
    highest: 2,
    upper: oneRupiahLimit,
    lower: oneRupiahLimit,
  },
  // From 158.10 to 251.10, where prices from Rp200 move in steps of Rp2.
  {
    date: "2026-10-01",
    reference: 186,
    lowest: 159,
    highest: 250,
    upper: rateLimit(3_500),
    lower: rateLimit(1_500),
  },
  // From 1,062.50 to 1,562.50.
  {
    date: "2026-10-01",
    reference: 1_250,
    lowest: 1_065,
    highest: 1_560,
    upper: rateLimit(2_500),
    lower: rateLimit(1_500),
  },
  // From 4,250 to 6,250, because Rp5,000 is the highest reference price of the band of 25%.
  {
    date: "2026-10-01",
    reference: 5_000,
    lowest: 4_250,
    highest: 6_250,
    upper: rateLimit(2_500),
    lower: rateLimit(1_500),
  },
  // From 4,271.25 to 6,030.
  {
    date: "2026-10-01",
    reference: 5_025,
    lowest: 4_280,
    highest: 6_025,
    upper: rateLimit(2_000),
    lower: rateLimit(1_500),
  },
  // From 13.02 to 18.90, so a stock at Rp14 could not fall on 19 October 2026, which IDX changed the next day.
  {
    date: "2026-10-19",
    reference: 14,
    lowest: 14,
    highest: 18,
    upper: rateLimit(3_500),
    lower: rateLimit(700),
  },
  // From 13 to 18.90.
  {
    date: "2026-10-20",
    reference: 14,
    lowest: 13,
    highest: 18,
    upper: rateLimit(3_500),
    lower: oneRupiahLimit,
  },
  // From 9 to 11.
  {
    date: "2026-11-02",
    reference: 10,
    lowest: 9,
    highest: 11,
    upper: oneRupiahLimit,
    lower: oneRupiahLimit,
  },
  // From 13.95 to 20.25.
  {
    date: "2026-11-02",
    reference: 15,
    lowest: 14,
    highest: 20,
    upper: rateLimit(3_500),
    lower: rateLimit(700),
  },
  // From 186 to 270.
  {
    date: "2026-11-02",
    reference: 200,
    lowest: 186,
    highest: 270,
    upper: rateLimit(3_500),
    lower: rateLimit(700),
  },
  // From 186.93 to 251.25.
  {
    date: "2026-11-02",
    reference: 201,
    lowest: 187,
    highest: 250,
    upper: rateLimit(2_500),
    lower: rateLimit(700),
  },
  // From 4,594.20 to 6,175, where the lowest price moves in steps of Rp10 and the highest in steps of Rp25.
  {
    date: "2026-11-02",
    reference: 4_940,
    lowest: 4_600,
    highest: 6_175,
    upper: rateLimit(2_500),
    lower: rateLimit(700),
  },
  // From 22,878 to 29,520.
  {
    date: "2026-11-02",
    reference: 24_600,
    lowest: 22_900,
    highest: 29_500,
    upper: rateLimit(2_000),
    lower: rateLimit(700),
  },
];

for (const { date, reference, lowest, highest, upper, lower } of ranges) {
  test(`accepts prices from Rp${String(lowest)} to Rp${String(highest)} for a reference price of Rp${String(reference)} on ${date}`, () => {
    expect(
      acceptedPriceRange(rupiah(reference), idxRulesForTest(date)),
    ).toEqual({
      reference,
      lowest,
      highest,
      upper,
      lower,
    });
  });
}

const november = idxRulesForTest("2026-11-02");
const bbcaRange = acceptedPriceRange(rupiah(4_940), november);

test("accepts a limit price at either end of the range", () => {
  expect(checkLimitPrice(rupiah(4_600), bbcaRange, november)).toEqual({
    ok: true,
    value: 4_600,
  });
  expect(checkLimitPrice(rupiah(6_175), bbcaRange, november)).toEqual({
    ok: true,
    value: 6_175,
  });
});

test("rejects a limit price beyond either end of the range, with the range", () => {
  for (const price of [4_590, 6_200]) {
    expect(checkLimitPrice(rupiah(price), bbcaRange, november)).toEqual({
      ok: false,
      failure: { kind: "outsideLimits", price, ...bbcaRange },
    });
  }
});

test("rejects a limit price between two steps of its band, with the valid prices on either side", () => {
  expect(checkLimitPrice(rupiah(4_985), bbcaRange, november)).toEqual({
    ok: false,
    failure: {
      kind: "offTick",
      price: 4_985,
      tick: 10,
      bandFrom: 2_000,
      nextBandFrom: 5_000,
      below: 4_980,
      above: 4_990,
    },
  });
  expect(checkLimitPrice(rupiah(5_010), bbcaRange, november)).toEqual({
    ok: false,
    failure: {
      kind: "offTick",
      price: 5_010,
      tick: 25,
      bandFrom: 5_000,
      nextBandFrom: undefined,
      below: 5_000,
      above: 5_025,
    },
  });
});

test("gives the start of the next band as the valid price above a price at the top of a band", () => {
  const range = acceptedPriceRange(rupiah(2_000), november);
  expect(checkLimitPrice(rupiah(1_998), range, november)).toEqual({
    ok: false,
    failure: {
      kind: "offTick",
      price: 1_998,
      tick: 5,
      bandFrom: 500,
      nextBandFrom: 2_000,
      below: 1_995,
      above: 2_000,
    },
  });
});
