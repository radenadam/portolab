import { basisPoints } from "~/units/basis-points";
import type { BasisPoints } from "~/units/basis-points";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";

/** How far the price of an order may lie from the reference price, as a rate of the reference price or as an amount of rupiah. */
export type PriceLimit =
  { kind: "rate"; rate: BasisPoints } | { kind: "amount"; amount: Rupiah };

/** A limit as a rate of the reference price, such as 700 basis points for 7%. */
export function rateLimit(rateInBasisPoints: number): PriceLimit {
  return { kind: "rate", rate: basisPoints(rateInBasisPoints) };
}

/** The limit of Rp1 that IDX sets for the lowest prices, where a step of Rp1 is more than any rate allows. */
export const oneRupiahLimit: PriceLimit = { kind: "amount", amount: rupiah(1) };
