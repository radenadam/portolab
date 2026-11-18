import { and, eq } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { watchlist } from "./watchlist.schema";

export function watchedCodes(database: Database, userId: UserId): string[] {
  return database
    .select({ code: watchlist.code })
    .from(watchlist)
    .where(eq(watchlist.userId, userId))
    .orderBy(watchlist.code)
    .all()
    .map((entry) => entry.code);
}

/** Repeated native submissions must preserve the first addition and leave a removed star removed. */
export function setWatched(
  database: Database,
  { userId, code, watched }: { userId: UserId; code: string; watched: boolean },
  now: Date,
): void {
  if (watched) {
    database
      .insert(watchlist)
      .values({ userId, code, addedAt: now })
      .onConflictDoNothing()
      .run();
  } else {
    database
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.code, code)))
      .run();
  }
}
