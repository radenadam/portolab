import { eq } from "drizzle-orm";
import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { users } from "./accounts.schema";
import type { UserId } from "./accounts.schema";
import { updateAccount } from "./account-store.server";
import { createTestStudent } from "./accounts-for-test.server";
import {
  currentSessionContext,
  reloadSessionAccount,
  requireUser,
} from "./current-session.server";
import { createSession, resumeSession } from "./session-store.server";

const now = new Date("2026-11-02T03:00:00.000Z");
const url = new URL("/account", "http://localhost");

/** The context of a request of a student, after the session middleware read the account and before the action changes it. */
async function contextOfStudent(
  database: Database,
): Promise<{ context: RouterContextProvider; id: UserId }> {
  const id = await createTestStudent(database, "sari", "Sari Wulandari");
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(
    currentSessionContext,
    resumeSession(database, createSession(database, id, now), now),
  );
  return { context, id };
}

test("serves the account as an action changed it to the loaders after the action in the same request", async () => {
  const database = openDatabaseForTest();
  const { context, id } = await contextOfStudent(database);
  await updateAccount(database, id, { name: "Sari Dewi" });
  expect(requireUser(context, url).name).toBe("Sari Wulandari");
  reloadSessionAccount(context, url);
  expect(requireUser(context, url).name).toBe("Sari Dewi");
});

test("signs out a person whose account the person who runs the server deleted after the session middleware read it", async () => {
  const database = openDatabaseForTest();
  const { context, id } = await contextOfStudent(database);
  database.delete(users).where(eq(users.id, id)).run();
  expect(context.get(currentSessionContext)).toBeDefined();
  reloadSessionAccount(context, url);
  expect(context.get(currentSessionContext)).toBeUndefined();
});
