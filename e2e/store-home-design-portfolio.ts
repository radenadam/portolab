import { eq } from "drizzle-orm";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { setFirstSessionDate } from "../app/features/classes/class-store.server.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

// Python Decimal adds these holdings' costs and cash to this starting amount.
export const homeDesignStartingCash = rupiah(42_042_560);

export function storeHomeDesignPortfolio(classId: ClassId): void {
  // The values and costs are the recorded quotes and independently computed fixture of measures-for-test.server.ts, which home-portfolio.test.tsx checks on this screen. As storeTestHolding explains, no fixture quote can fill an order, so the holdings are stored without orders.
  storeTestHolding(
    classId,
    {
      code: "BBCA",
      shares: shares(5_500),
      cost: rupiah(27_431_085),
      cash: rupiah(10_956_000),
    },
    [{ code: "AMMN", shares: shares(1_000), cost: rupiah(3_655_475) }],
  );
  writeForTestStudent(classId, (database, membershipId) => {
    setFirstSessionDate(database, classId, "2026-10-26");
    database
      .update(memberships)
      .set({ joinedAt: new Date("2026-10-26T10:00:00Z") })
      .where(eq(memberships.id, membershipId))
      .run();
  });
}
