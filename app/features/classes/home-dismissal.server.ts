import { eq } from "drizzle-orm";
import type { Database } from "../../database/database.server.ts";
import { memberships } from "./classes.schema.ts";
import type { MembershipId } from "./classes.schema.ts";

/** The caller authorizes the membership before reading or closing its home summary. */
export function readHomeDismissedAt(
  database: Database,
  membershipId: MembershipId,
): Date | undefined {
  return (
    database
      .select({ moment: memberships.homeDismissedAt })
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .get()?.moment ?? undefined
  );
}

export function dismissHomeSince(
  database: Database,
  membershipId: MembershipId,
  now: Date,
): void {
  database
    .update(memberships)
    .set({ homeDismissedAt: now })
    .where(eq(memberships.id, membershipId))
    .run();
}
