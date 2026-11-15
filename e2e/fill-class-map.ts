import { eq } from "drizzle-orm";
import {
  classes,
  memberships,
} from "../app/features/classes/classes.schema.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import {
  holdings,
  portfolios,
} from "../app/features/trading/trading.schema.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { createClassStudent } from "./create-class-student.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import { writeTestDatabase } from "./write-test-database.ts";

/** Fills a class with BBCA portfolios of different cash weights, so a band of nearby points can cover a fixed label. */
export async function fillClassMap(
  classId: ClassId,
  { studentCount, now }: { studentCount: number; now: Date },
): Promise<void> {
  await writeTestDatabase(async (database) => {
    const taught = database
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .get();
    if (taught === undefined) throw new Error("The map test class is missing.");
    for (let index = 1; index < studentCount; index += 1) {
      const { studentId } = await createClassStudent(database, classId, {
        name: `Mahasiswa ${String(index)}`,
        now,
      });
      const membership = database
        .select()
        .from(memberships)
        .where(eq(memberships.studentId, studentId))
        .get();
      if (membership === undefined)
        throw new Error("The map student did not join.");
      // Whole percentage slices of this recorded purchase keep both its shares and its rupiah whole.
      const percent = Math.floor((index * 100) / studentCount);
      const shareCount = shares((bbcaHolding.shares / 100) * percent);
      const cost = rupiah((bbcaHolding.cost / 100) * percent);
      database
        .insert(portfolios)
        .values({
          membershipId: membership.id,
          cash: rupiah(taught.startingCash - cost),
        })
        .run();
      database
        .insert(holdings)
        .values({
          membershipId: membership.id,
          code: bbcaHolding.code,
          shares: shareCount,
          cost,
        })
        .run();
    }
  });
}
