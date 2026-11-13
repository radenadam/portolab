import { expect, test } from "vitest";
import { companyOf } from "./company-of";
import { trackedStockCodes } from "./tracked-instruments";

test("gives the company of each stock of every recorded period of the universe the name that IDX gives it, without a PT before it or a period after Tbk", () => {
  for (const code of trackedStockCodes) {
    const { name, source } = companyOf(code);
    expect(name, code).toMatch(/^(?!PT )\S.* Tbk$/);
    expect(source, code).not.toBe("");
  }
});

// Every code that Portolab stores came from the universe, so only a row that someone wrote into the database by hand holds another one.
test("fails for a code that Portolab does not track, which only a broken database holds", () => {
  expect(() => companyOf("BREN")).toThrow(
    "Portolab tracks no stock with the code BREN, so no code of Portolab stored it, and the database is broken.",
  );
});
