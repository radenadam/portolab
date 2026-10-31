import { expect, test } from "vitest";
import { readConfig } from "./config.server";

test("uses the defaults when no variable is set", () => {
  expect(readConfig({})).toEqual({
    ok: true,
    value: { databasePath: "data/portolab.sqlite", priceSource: "yahoo" },
  });
});

test("reads the database path and the price source", () => {
  expect(
    readConfig({
      DATABASE_PATH: "/srv/portolab.sqlite",
      PRICE_SOURCE: "fixture",
    }),
  ).toEqual({
    ok: true,
    value: { databasePath: "/srv/portolab.sqlite", priceSource: "fixture" },
  });
});

test("rejects an unknown price source and names it", () => {
  expect(readConfig({ PRICE_SOURCE: "google" })).toEqual({
    ok: false,
    failure: 'PRICE_SOURCE must be "yahoo" or "fixture", but it is "google".',
  });
});
