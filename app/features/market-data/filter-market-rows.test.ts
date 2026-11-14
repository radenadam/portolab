import { expect, test } from "vitest";
import { filterMarketRows } from "./filter-market-rows";
import { defaultMarketFilters, marketSorts } from "./market-filters";
import { marketContextForTest } from "./market-context-for-test.server";
import { readMarket } from "./read-market.server";

const now = new Date("2026-11-14T00:00:00.000Z");
test("filters codes and company names without case or surrounding spaces and combines the query with its sector", async () => {
  const { rows } = readMarket(await marketContextForTest(), now, "3m");
  expect(
    filterMarketRows(rows, { ...defaultMarketFilters, query: " bBcA " }).map(
      (row) => row.code,
    ),
  ).toEqual(["BBCA"]);
  expect(
    filterMarketRows(rows, {
      ...defaultMarketFilters,
      query: "central asia",
    }).map((row) => row.code),
  ).toEqual(["BBCA"]);
  expect(
    filterMarketRows(rows, {
      ...defaultMarketFilters,
      query: "central asia",
      sector: "energy",
    }),
  ).toEqual([]);
});
for (const sort of marketSorts) {
  test(`sorts ${sort} in both directions with missing values last and code as a tie break`, async () => {
    const { rows } = readMarket(await marketContextForTest(), now, "3m");
    const ascending = filterMarketRows(rows, {
      ...defaultMarketFilters,
      sort,
      direction: "ascending",
    });
    const descending = filterMarketRows(rows, {
      ...defaultMarketFilters,
      sort,
      direction: "descending",
    });
    switch (sort) {
      case "price":
      case "change":
        expect(ascending.at(-1)?.code).toBe("WIFI");
        expect(descending.at(-1)?.code).toBe("WIFI");
        break;
      case "beta":
      case "volatility":
        expect(ascending.at(-1)?.measures).toBeUndefined();
        expect(descending.at(-1)?.measures).toBeUndefined();
        break;
      case "code":
        expect(ascending[0]?.code).toBe("AADI");
        expect(descending[0]?.code).toBe("WIFI");
    }
    expect(ascending.map((row) => row.code)).not.toEqual(
      descending.map((row) => row.code),
    );
  });
}

test("reads only the current universe and includes missing quotes and measures", async () => {
  const context = await marketContextForTest();
  const first = readMarket(context, now, "3m");
  expect(first.rows).toHaveLength(45);
  expect(first.rows.find((row) => row.code === "WIFI")?.quote).toBeUndefined();
  expect(
    first.rows.find((row) => row.code === "AADI")?.measures,
  ).toBeUndefined();
  expect(first.rows.find((row) => row.code === "AMMN")?.measures).toBeDefined();
  expect(first.rows.find((row) => row.code === "BBCA")?.closes).toHaveLength(5);
  const next = readMarket(context, new Date("2026-11-18T00:00:00.000Z"), "3m");
  expect(next.rows.some((row) => row.code === "MAPI")).toBe(false);
  expect(next.rows.some((row) => row.code === "ERAA")).toBe(true);
  const uncovered = readMarket(
    context,
    new Date("2027-02-01T00:00:00.000Z"),
    "3m",
  );
  expect(uncovered.universeAvailable).toBe(false);
  expect(uncovered.rows).toEqual([]);
});

test("clamps a month range at a shorter month and keeps every stored final close through today", async () => {
  const context = await marketContextForTest();
  const month = readMarket(context, new Date("2026-11-30T12:00:00.000Z"), "1m");
  expect(month.indexCloses.map((close) => close.date)).toEqual(["2026-10-30"]);
  const long = readMarket(context, now, "1y");
  expect(long.indexCloses[0]?.date).toBe("2025-11-28");
});
