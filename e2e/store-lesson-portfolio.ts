import { rupiah, type Rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import { storeTestHolding } from "./store-test-holding.ts";

type LessonPortfolio = "recorded" | "fractional" | "tiny" | "minimum";

export function storeLessonPortfolio(
  classId: ClassId,
  shape: LessonPortfolio = "recorded",
): void {
  const settings: Record<
    LessonPortfolio,
    {
      cash: Rupiah;
      smallHoldings: boolean;
      oneHolding: boolean;
    }
  > = {
    recorded: {
      cash: rupiah(10_956_000),
      smallHoldings: false,
      oneHolding: false,
    },
    fractional: {
      cash: rupiah(304_000),
      smallHoldings: true,
      oneHolding: false,
    },
    tiny: {
      cash: startingCashLimits.maximum,
      smallHoldings: false,
      oneHolding: false,
    },
    minimum: {
      cash: rupiah(Number.MAX_SAFE_INTEGER - 198_000),
      smallHoldings: true,
      oneHolding: true,
    },
  };
  const { cash, smallHoldings, oneHolding } = settings[shape];
  // Recorded quotes and costs match measures-for-test.server.ts, so the fixture changes weights without invented returns. The smaller holdings value BBCA at Rp498,000 and TLKM at Rp198,000, which with Rp304,000 cash give 49.8%, 19.8%, and 30.4% by hand.
  const tlkm = {
    code: "TLKM",
    shares: shares(smallHoldings ? 100 : 8300),
    cost: rupiah(smallHoldings ? 198_297 : 16_458_651),
  };
  const first = oneHolding
    ? tlkm
    : {
        code: "BBCA",
        shares: shares(smallHoldings ? 100 : 5500),
        cost: rupiah(smallHoldings ? 498_747 : 27_431_085),
      };
  storeTestHolding(classId, { ...first, cash }, oneHolding ? [] : [tlkm]);
}
