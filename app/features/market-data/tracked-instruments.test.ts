import { expect, test } from "vitest";
import { trackedInstruments, universeOn } from "./tracked-instruments";

test("tracks the IHSG and each stock of the universe once, by code", () => {
  const codes = trackedInstruments.map((instrument) => instrument.code);
  expect(trackedInstruments[0]).toEqual({ kind: "index", code: "IHSG" });
  expect(new Set(codes).size).toBe(codes.length);
  const stockCodes = codes.slice(1);
  expect(stockCodes).toEqual([...stockCodes].sort());
});

test("gives the 45 stocks of the LQ45 from the first to the last trading day of a period", () => {
  for (const date of ["2026-11-02", "2027-01-29"]) {
    const universe = universeOn(date);
    expect(universe.ok && universe.value).toHaveLength(45);
  }
});

test("fails for a date that no recorded period covers, and names the date", () => {
  expect(universeOn("2027-02-01")).toEqual({
    ok: false,
    failure:
      "No recorded period of the LQ45 covers 2027-02-01, so add the stocks of the latest review of IDX to tracked-instruments.ts.",
  });
  expect(universeOn("2026-10-30")).toEqual({
    ok: false,
    failure:
      "No recorded period of the LQ45 covers 2026-10-30, so add the stocks of the latest review of IDX to tracked-instruments.ts.",
  });
});
