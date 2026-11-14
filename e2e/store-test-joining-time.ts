import { eq } from "drizzle-orm";
import type { Database } from "../app/database/database.server.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import type { MembershipId } from "../app/features/classes/classes.schema.ts";

/** A test replays a recorded period, so its membership starts in that period too. */
export function storeTestJoiningTime(
  database: Database,
  membershipId: MembershipId,
  joinedAt: Date,
): void {
  database
    .update(memberships)
    .set({ joinedAt })
    .where(eq(memberships.id, membershipId))
    .run();
}
