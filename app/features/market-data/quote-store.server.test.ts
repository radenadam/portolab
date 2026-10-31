import { afterEach, expect, test } from "vitest";
import { closeDatabase, openDatabase } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { rupiah } from "~/units/rupiah";
import {
  listLatestQuotes,
  readLatestUpdateAttempt,
  saveQuotes,
  saveUpdateAttempt,
} from "./quote-store.server";

const openDatabases: Database[] = [];

afterEach(() => {
  for (const database of openDatabases.splice(0)) {
    closeDatabase(database);
  }
});

function memoryDatabase(): Database {
  const database = openDatabase(":memory:");
  openDatabases.push(database);
  return database;
}

test("keeps only the latest quote of each instrument, the indices first", () => {
  const database = memoryDatabase();
  const quotedAt = new Date("2026-10-30T09:14:55.000Z");
  saveQuotes(
    database,
    [
      {
        kind: "stock",
        code: "BBCA",
        price: rupiah(4940),
        previousClose: rupiah(4900),
        quotedAt,
      },
    ],
    quotedAt,
  );
  saveQuotes(
    database,
    [
      {
        kind: "stock",
        code: "BBCA",
        price: rupiah(4980),
        previousClose: rupiah(4940),
        quotedAt,
      },
      {
        kind: "index",
        code: "IHSG",
        level: 5057.05,
        previousLevel: 5098.06,
        quotedAt,
      },
    ],
    quotedAt,
  );
  expect(listLatestQuotes(database)).toEqual([
    {
      kind: "index",
      code: "IHSG",
      level: 5057.05,
      previousLevel: 5098.06,
      quotedAt,
    },
    {
      kind: "stock",
      code: "BBCA",
      price: 4980,
      previousClose: 4940,
      quotedAt,
    },
  ]);
});

test("keeps only the latest attempt to update prices", () => {
  const database = memoryDatabase();
  expect(readLatestUpdateAttempt(database)).toBeUndefined();
  saveUpdateAttempt(database, {
    attemptedAt: new Date("2026-10-30T09:29:00.000Z"),
    succeeded: true,
  });
  saveUpdateAttempt(database, {
    attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
    succeeded: false,
  });
  expect(readLatestUpdateAttempt(database)).toEqual({
    attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
    succeeded: false,
  });
});
