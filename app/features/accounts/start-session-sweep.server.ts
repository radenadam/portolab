import type { Database } from "~/database/database.server";
import { hourMilliseconds } from "~/time-units";
import { deleteExpiredSessions } from "./session-store.server";

// A session ends when it was unused for days, so a sweep each hour removes its row within an hour of its end.
const sweepIntervalMilliseconds = hourMilliseconds;

/** Deletes the sessions that ended, at once and then every hour, and returns the function that stops the sweep. */
export function startSessionSweep(database: Database): () => void {
  deleteExpiredSessions(database, new Date());
  const timer = setInterval(() => {
    deleteExpiredSessions(database, new Date());
  }, sweepIntervalMilliseconds);
  return () => {
    clearInterval(timer);
  };
}
