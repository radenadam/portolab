import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import { listLatestQuotes, saveQuotes } from "./quote-store.server";

test("keeps only the latest quote of each instrument, the indices first", () => {
  const database = openDatabaseForTest();
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
        level: indexPoints(5057.05),
        previousLevel: indexPoints(5098.06),
        quotedAt,
      },
    ],
    quotedAt,
  );
  expect(listLatestQuotes(database)).toEqual([
    {
      kind: "index",
      code: "IHSG",
      level: indexPoints(5057.05),
      previousLevel: indexPoints(5098.06),
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
