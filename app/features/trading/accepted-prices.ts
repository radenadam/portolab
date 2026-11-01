import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { basisPointsPerWhole } from "~/units/basis-points";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { AutoRejectionBand, IdxRules, TickBand } from "./idx-rules-on";
import type { PriceLimit } from "./price-limits";
import { roundedShare } from "./rounded-share";
import type { Rounding } from "./rounded-share";

/** The band of tick sizes that a price falls in, with the start of the next band, which the highest band has none of. */
interface TickBandOfPrice {
  band: TickBand;
  nextFrom: Rupiah | undefined;
}

/** The prices that IDX accepts for a stock on one day, from the reference price and the limits of its band. */
export interface PriceRange {
  reference: Rupiah;
  lowest: Rupiah;
  highest: Rupiah;
  upper: PriceLimit;
  lower: PriceLimit;
}

/** Why IDX would reject the price of a limit order. */
export type PriceFailure =
  | ({ kind: "outsideLimits"; price: Rupiah } & PriceRange)
  | {
      kind: "offTick";
      price: Rupiah;
      tick: Rupiah;
      bandFrom: Rupiah;
      nextBandFrom: Rupiah | undefined;
      below: Rupiah;
      above: Rupiah;
    };

function tickBandOf(
  price: Rupiah,
  bands: readonly TickBand[],
): TickBandOfPrice {
  let found: TickBandOfPrice | undefined;
  for (const [index, band] of bands.entries()) {
    if (price >= band.from) {
      found = { band, nextFrom: bands[index + 1]?.from };
    }
  }
  if (found === undefined) {
    throw new Error(
      `Every price of an order is at least the minimum price, which the lowest band of tick sizes starts at or below, but ${String(price)} is below every band.`,
    );
  }
  return found;
}

// Each band starts at a multiple of the tick of the band below it, so rounding a price to the tick of its own band always reaches a price that IDX accepts.
function validPriceRounded(
  price: Rupiah,
  bands: readonly TickBand[],
  rounding: Rounding,
): Rupiah {
  const { tick } = tickBandOf(price, bands).band;
  return rupiah(
    roundedShare(price, { numerator: 1, denominator: tick }, rounding) * tick,
  );
}

function autoRejectionBandOf(
  reference: Rupiah,
  bands: readonly AutoRejectionBand[],
): AutoRejectionBand {
  for (const band of bands) {
    if (band.upTo === undefined || reference <= band.upTo) {
      return band;
    }
  }
  throw new Error(
    `The highest band of auto rejection limits covers every reference price, but none covers ${String(reference)}.`,
  );
}

type LimitSide = "above" | "below";

// IDX rejects only a price that lies beyond a limit, so the price at a limit is rounded toward the reference price.
const limitSides: Record<LimitSide, { sign: number; rounding: Rounding }> = {
  above: { sign: 1, rounding: "down" },
  below: { sign: -1, rounding: "up" },
};

/** The price at a limit from the reference price, above it or below it, in whole rupiah. */
function priceAtLimit(
  reference: Rupiah,
  limit: PriceLimit,
  side: LimitSide,
): Rupiah {
  const { sign, rounding } = limitSides[side];
  switch (limit.kind) {
    case "amount":
      return rupiah(reference + sign * limit.amount);
    case "rate":
      return rupiah(
        roundedShare(
          reference,
          {
            numerator: basisPointsPerWhole + sign * limit.rate,
            denominator: basisPointsPerWhole,
          },
          rounding,
        ),
      );
  }
}

/** The lowest and the highest price that IDX accepts on a day for a stock with a reference price. Each is the valid price nearest to its limit on the side of the reference price, and the lowest is never below the minimum price. */
export function acceptedPriceRange(
  reference: Rupiah,
  rules: IdxRules,
): PriceRange {
  const { upper, lower } = autoRejectionBandOf(
    reference,
    rules.autoRejectionBands,
  );
  const lowestAtLimit = priceAtLimit(reference, lower, "below");
  return {
    reference,
    lowest:
      lowestAtLimit <= rules.minimumPrice
        ? rules.minimumPrice
        : validPriceRounded(lowestAtLimit, rules.tickBands, "up"),
    highest: validPriceRounded(
      priceAtLimit(reference, upper, "above"),
      rules.tickBands,
      "down",
    ),
    upper,
    lower,
  };
}

/** Checks the price of a limit order against the range that IDX accepts on its day and against the tick size of its band. For a price between two valid prices, the failure gives both, which both lie in the range, because its ends are valid prices. */
export function checkLimitPrice(
  price: Rupiah,
  range: PriceRange,
  rules: IdxRules,
): Result<Rupiah, PriceFailure> {
  if (price < range.lowest || price > range.highest) {
    return fail({ kind: "outsideLimits", price, ...range });
  }
  const { band, nextFrom } = tickBandOf(price, rules.tickBands);
  if (price % band.tick === 0) {
    return succeed(price);
  }
  return fail({
    kind: "offTick",
    price,
    tick: band.tick,
    bandFrom: band.from,
    nextBandFrom: nextFrom,
    below: validPriceRounded(price, rules.tickBands, "down"),
    above: validPriceRounded(price, rules.tickBands, "up"),
  });
}
