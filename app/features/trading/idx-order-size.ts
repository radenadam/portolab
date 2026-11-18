import { lots } from "../../units/lots.ts";
import { shares } from "../../units/shares.ts";

export const idxOrderSize = {
  from: "2014-01-06",
  lotShares: shares(100),
  maximumLots: lots(50_000),
  source:
    "Kep-00071/BEI/11-2013 of 8 November 2013, as detikFinance and Okezone reported it",
};
