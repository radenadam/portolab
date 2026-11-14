import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

export function storeGradingPortfolio(classId: ClassId): void {
  storeTestHolding(classId, bbcaHolding);
  writeForTestStudent(classId, (database, membershipId) => {
    storeTestJoiningTime(
      database,
      membershipId,
      new Date("2026-10-26T10:00:00Z"),
    );
  });
}
