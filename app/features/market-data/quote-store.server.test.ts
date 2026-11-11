import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { minutesAfter } from "~/time-units";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import {
  findIndexQuote,
  findStockQuote,
  listFreshStockQuotes,
  listLatestQuotes,
  saveQuotes,
} from "./quote-store.server";
import {
  failingSourceForTest,
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "./quote-updates-for-test.server";
import { stockQuote } from "./stock-quote";

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

// The closing quotes of BBCA and TLKM of Friday 30 October 2026, as fixture-price-source.server.ts records them.
const bbcaClose = stockQuote("BBCA", [4_980, 4_940], "2026-10-30T09:14:55Z");
const tlkmClose = stockQuote("TLKM", [1_980, 1_980], "2026-10-30T09:14:51Z");
// 16:20 WIB on Friday 30 October 2026, and the minutes after it.
const afterClose = new Date("2026-10-30T09:20:00Z");

test("finds the latest quote of a stock, and none for a stock without a stored quote", () => {
  const database = openDatabaseForTest();
  saveQuotes(database, [bbcaClose], afterClose);
  expect(findStockQuote(database, "BBCA")).toEqual(bbcaClose);
  expect(findStockQuote(database, "BREN")).toBeUndefined();
});

test("finds the latest quote of the IHSG, and none before the first one is stored", () => {
  const database = openDatabaseForTest();
  expect(findIndexQuote(database, "IHSG")).toBeUndefined();
  const ihsgClose = {
    kind: "index",
    code: "IHSG",
    level: indexPoints(5_057.05),
    previousLevel: indexPoints(5_098.06),
    quotedAt: new Date("2026-10-30T09:14:00Z"),
  } as const;
  saveQuotes(database, [ihsgClose, bbcaClose], afterClose);
  expect(findIndexQuote(database, "IHSG")).toEqual(ihsgClose);
});

test("gives the quotes that the latest attempt fetched, without a stock that it could not update, whose stored quote is older", async () => {
  const database = openDatabaseForTest();
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaClose, tlkmClose]),
    { at: afterClose },
  );
  await updateQuotesForTest(database, sourceAnsweringForTest([bbcaClose]), {
    at: minutesAfter(afterClose, 1),
  });
  expect(findStockQuote(database, "TLKM")).toEqual(tlkmClose);
  expect(listFreshStockQuotes(database)).toEqual(
    new Map([["BBCA", bbcaClose]]),
  );
});

test("gives no quote while the latest attempt failed or before the first attempt", async () => {
  const database = openDatabaseForTest();
  expect(listFreshStockQuotes(database)).toEqual(new Map());
  await updateQuotesForTest(database, sourceAnsweringForTest([bbcaClose]), {
    at: afterClose,
  });
  await updateQuotesForTest(database, failingSourceForTest, {
    at: minutesAfter(afterClose, 1),
  });
  expect(findStockQuote(database, "BBCA")).toEqual(bbcaClose);
  expect(listFreshStockQuotes(database)).toEqual(new Map());
});
