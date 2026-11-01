import { dayMilliseconds, hourMilliseconds } from "~/time-units";
import { expect, onTestFinished, test, vi } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createSession, resumeSession } from "./session-store.server";
import { startSessionSweep } from "./start-session-sweep.server";
import { createTestLecturer } from "./accounts-for-test.server";

const start = new Date("2026-11-02T03:00:00.000Z");
const fourteenDays = 14 * dayMilliseconds;

test("deletes the sessions that ended at its start and then every hour, without any request", async () => {
  const database = openDatabaseForTest();
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
  const lastUseWithinAnHourOfEnd = new Date(
    start.getTime() - fourteenDays + hourMilliseconds / 2,
  );
  const endsWithinAnHour = createSession(
    database,
    account.id,
    lastUseWithinAnHourOfEnd,
  );
  const stop = startSessionSweep(database);
  onTestFinished(stop);
  // A session that the sweep deleted stays missing, whatever moment a later request names.
  expect(resumeSession(database, ended, start)).toBeUndefined();
  expect(
    resumeSession(database, endsWithinAnHour, lastUseWithinAnHourOfEnd),
  ).toBeDefined();
  vi.advanceTimersByTime(hourMilliseconds);
  expect(
    resumeSession(database, endsWithinAnHour, lastUseWithinAnHourOfEnd),
  ).toBeUndefined();
});
