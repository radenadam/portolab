import { eq } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { priceUpdates } from "./market-data.schema";

/** The jobs that update prices: the latest quotes during trading sessions, and the daily closes after each close. */
export type UpdateJob = "quotes" | "history";

export interface UpdateAttempt {
  /** When the attempt was made. An attempt that makes several requests counts from the end of its last request, so the wait after failures starts after it. */
  attemptedAt: Date;
  /** Whether the source answered with at least one usable price. */
  succeeded: boolean;
  /** The failures in a row up to this attempt, which decide how long the job waits before the next one. Each job decides what counts as a failure. */
  consecutiveFailures: number;
  /** The codes of the instruments that this attempt could not update, which are all of them when it failed. */
  failedCodes: string[];
  /** The latest trading day in the closes that the attempt asked for. The history job records it apart from the time of the attempt, because a long run can end after a later close has become final. The quote job asks for no closes, so it has none. */
  finalDate?: string | undefined;
}

// The schema explains why price_updates holds one row for each job.
const attemptIds: Record<UpdateJob, number> = { quotes: 1, history: 2 };

export function saveUpdateAttempt(
  database: Database,
  job: UpdateJob,
  attempt: UpdateAttempt,
): void {
  const row = {
    id: attemptIds[job],
    ...attempt,
    finalDate: attempt.finalDate ?? null,
  };
  database
    .insert(priceUpdates)
    .values(row)
    .onConflictDoUpdate({ target: priceUpdates.id, set: row })
    .run();
}

export function readLatestUpdateAttempt(
  database: Database,
  job: UpdateJob,
): UpdateAttempt | undefined {
  const [row] = database
    .select()
    .from(priceUpdates)
    .where(eq(priceUpdates.id, attemptIds[job]))
    .all();
  return row === undefined
    ? undefined
    : {
        attemptedAt: row.attemptedAt,
        succeeded: row.succeeded,
        consecutiveFailures: row.consecutiveFailures,
        failedCodes: row.failedCodes,
        finalDate: row.finalDate ?? undefined,
      };
}
