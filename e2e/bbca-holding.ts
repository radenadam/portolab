import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";

/** A holding of 100,000,000 shares of BBCA, which cost Rp494,741,000,000 at the close of 29 October 2026 of Rp4,940 with a broker fee of 0.15%, and the Rp505,259,000,000 that the starting cash of Rp1,000,000,000,000 leaves. At the quote of Rp4,980 of the fixture source the shares are worth Rp498,000,000,000, so the portfolio is worth Rp1,003,259,000,000, the widest total that the most starting cash of a class reaches with a gain. */
export const bbcaHolding = {
  cash: rupiah(505_259_000_000),
  code: "BBCA",
  shares: shares(100_000_000),
  cost: rupiah(494_741_000_000),
};
