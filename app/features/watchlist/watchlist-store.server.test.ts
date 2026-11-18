import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createTestStudent } from "~/features/accounts/accounts-for-test.server";
import { users } from "~/features/accounts/accounts.schema";
import { setWatched, watchedCodes } from "./watchlist-store.server";
import { watchlist } from "./watchlist.schema";

const now = new Date("2026-11-02T03:00:00Z");
const later = new Date("2026-11-03T03:00:00Z");

test("keeps each person's stars and first addition until removal or account deletion", async () => {
  const database = openDatabaseForTest();
  const first = await createTestStudent(database, "nara", "Nara");
  const second = await createTestStudent(database, "bagas", "Bagas");
  setWatched(database, { userId: first, code: "TLKM", watched: true }, now);
  setWatched(database, { userId: first, code: "BBCA", watched: true }, now);
  setWatched(database, { userId: first, code: "BBCA", watched: true }, later);
  setWatched(database, { userId: second, code: "BBCA", watched: true }, later);
  expect(watchedCodes(database, first)).toEqual(["BBCA", "TLKM"]);
  expect(watchedCodes(database, second)).toEqual(["BBCA"]);
  expect(
    database
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, first))
      .orderBy(watchlist.code)
      .all(),
  ).toEqual([
    { userId: first, code: "BBCA", addedAt: now },
    { userId: first, code: "TLKM", addedAt: now },
  ]);
  setWatched(database, { userId: first, code: "BBCA", watched: false }, later);
  setWatched(database, { userId: first, code: "BBCA", watched: false }, later);
  expect(watchedCodes(database, first)).toEqual(["TLKM"]);
  expect(watchedCodes(database, second)).toEqual(["BBCA"]);
  database.delete(users).where(eq(users.id, first)).run();
  expect(watchedCodes(database, first)).toEqual([]);
  expect(watchedCodes(database, second)).toEqual(["BBCA"]);
});
