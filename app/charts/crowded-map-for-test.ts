import { plotFraction } from "~/units/plot-fraction";
import type { LabelledMark } from "./map-labels";

/** A repeatable crowd keeps a placement regression independent of random test order. */
export function crowdedMapForTest(): {
  portfolio: LabelledMark;
  holdings: LabelledMark[];
  others: LabelledMark[];
} {
  let state = 7;
  const next = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return 0.05 + (state / 2147483648) * 0.9;
  };
  const holdings: LabelledMark[] = [];
  const others: LabelledMark[] = [];
  for (let index = 0; index < 45; index += 1) {
    const isHeld = index < 5;
    const mark: LabelledMark = {
      key: `S${String(index).padStart(3, "0")}`,
      position: { x: plotFraction(next()), y: plotFraction(next()) },
      outerRadius: isHeld ? 0.8 : 0.42,
    };
    if (isHeld) {
      holdings.push(mark);
    } else {
      others.push(mark);
    }
  }
  return {
    portfolio: {
      key: "portfolio",
      position: { x: plotFraction(0.5), y: plotFraction(0.5) },
      outerRadius: 1.04,
    },
    holdings,
    others,
  };
}
