import { and, eq } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { memberships } from "./classes.schema";
import type { ClassId } from "./classes.schema";

/** Only the student's own membership can change, even when a form names another class. */
export function setStudentNim(
  database: Database,
  membership: { classId: ClassId; studentId: UserId; nim: string | null },
): boolean {
  return (
    database
      .update(memberships)
      .set({ nim: membership.nim })
      .where(
        and(
          eq(memberships.classId, membership.classId),
          eq(memberships.studentId, membership.studentId),
        ),
      )
      .run().changes === 1
  );
}
