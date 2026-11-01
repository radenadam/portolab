import { expect, onTestFinished, test, vi } from "vitest";
import { openTestDatabase } from "~/database/open-test-database.server";
import { createSession, resumeSession } from "./session-store.server";
import { startSessionSweep } from "./start-session-sweep.server";
import { createTestLecturer } from "./test-accounts.server";

const start = new Date("2026-11-02T03:00:00.000Z");
const hour = 60 * 60_000;
const fourteenDays = 14 * 24 * hour;

test("deletes the sessions that ended at its start and then every hour, without any request", async () => {
  const database = openTestDatabase();
  const { account } = await createTestLecturer(database, "dosen");
  vi.useFakeTimers({ now: start });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const ended = createSession(
    database,
    account.id,
    new Date(start.getTime() - fourteenDays),
  );
  const endsWithinAnHour = createSession(
    database,
    account.id,
    new Date(start.getTime() - fourteenDays + hour / 2),
  );
  const stop = startSessionSweep(database);
  onTestFinished(stop);
  // A session that the sweep deleted stays missing, whatever moment a later request names.
  expect(resumeSession(database, ended, start)).toBeUndefined();
  expect(
    resumeSession(
      database,
      endsWithinAnHour,
      new Date(start.getTime() - fourteenDays + hour / 2),
    ),
  ).toBeDefined();
  vi.advanceTimersByTime(hour);
  expect(
    resumeSession(
      database,
      endsWithinAnHour,
      new Date(start.getTime() - fourteenDays + hour / 2),
    ),
  ).toBeUndefined();
});
