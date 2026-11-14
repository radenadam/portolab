import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import {
  trackedInstruments,
  trackedStockCodes,
  universeOn,
} from "./tracked-instruments";

test("tracks the IHSG and each stock of the universe once, by code", () => {
  const codes = trackedInstruments.map((instrument) => instrument.code);
  expect(trackedInstruments[0]).toEqual({ kind: "index", code: "IHSG" });
  expect(new Set(codes).size).toBe(codes.length);
  const stockCodes = codes.slice(1);
  expect(stockCodes).toEqual([...stockCodes].sort());
  expect(trackedStockCodes).toEqual(stockCodes);
  const allPeriods = new Set([
    ...successValueForTest(
      universeOn("2026-11-17"),
      "The previous period is recorded",
    ),
    ...successValueForTest(
      universeOn("2026-11-18"),
      "The incidental review is recorded",
    ),
  ]);
  expect(stockCodes).toEqual([...allPeriods].sort());
  expect(stockCodes).toHaveLength(48);
});

test("gives the 45 stocks of the LQ45 from the first to the last trading day of a period", () => {
  for (const date of ["2026-11-02", "2026-11-17", "2026-11-18", "2027-01-29"]) {
    const codes = successValueForTest(
      universeOn(date),
      "The date has a recorded period",
    );
    expect(codes).toHaveLength(45);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual([...codes].sort());
  }
});

test("gives the 45 codes of Appendix 1 of Peng-00218 on the first and last day of the incidental review", () => {
  // The complete list was checked against the IDX announcement and Liputan6, because Kontan's list replaces ELSA with CUAN and misspells ERAA.
  const announced =
    "AADI ADMR ADRO AKRA AMMN AMRT ANTM ASII BBCA BBNI BBRI BBTN BMRI BRPT BUMI CPIN DEWA ELSA EMTK ERAA ESSA EXCL GGRM GOTO HRTA ICBP INCO INDF INDY INKP ISAT ITMG JPFA KLBF MBMA MDKA MEDC PGAS PTBA PWON SMGR TLKM UNTR UNVR WIFI".split(
      " ",
    );
  for (const date of ["2026-11-18", "2027-01-29"]) {
    expect(universeOn(date)).toEqual({ ok: true, value: announced });
  }
});

test("changes only the three announced replacements between 17 and 18 November 2026", () => {
  const previous = successValueForTest(
    universeOn("2026-11-17"),
    "The previous period is recorded",
  );
  const next = successValueForTest(
    universeOn("2026-11-18"),
    "The incidental review is recorded",
  );
  expect(previous.filter((code) => !next.includes(code))).toEqual([
    "MAPI",
    "NCKL",
    "PGEO",
  ]);
  expect(next.filter((code) => !previous.includes(code))).toEqual([
    "ERAA",
    "GGRM",
    "PWON",
  ]);
});

test("fails for a date that no recorded period covers, and names the date", () => {
  expect(universeOn("2027-02-01")).toEqual({
    ok: false,
    failure:
      "No recorded period of the LQ45 covers 2027-02-01, so add the stocks of the LQ45 that IDX set for that day to tracked-instruments.ts.",
  });
  expect(universeOn("2026-10-30")).toEqual({
    ok: false,
    failure:
      "No recorded period of the LQ45 covers 2026-10-30, so add the stocks of the LQ45 that IDX set for that day to tracked-instruments.ts.",
  });
});
