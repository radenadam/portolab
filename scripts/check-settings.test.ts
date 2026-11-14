import { expect, test } from "vitest";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { parseCheckSettings } from "./check-settings.ts";

test("keeps the existing ports and worker defaults when the slot is missing or zero", () => {
  for (const value of [undefined, "0", "00"]) {
    expect(parseCheckSettings(value, "The check slot")).toEqual({
      ok: true,
      value: {
        browser: 4173,
        development: 4174,
        hotReload: 24_678,
        maximumWorkers: undefined,
      },
    });
  }
});

test("chooses the ports and the worker limit together for each slot", () => {
  for (const [slot, browser, development, hotReload] of [
    ["1", 4175, 4176, 24_679],
    ["2", 4177, 4178, 24_680],
    ["99", 4371, 4372, 24_777],
  ] as const) {
    expect(parseCheckSettings(slot, "The check slot")).toEqual({
      ok: true,
      value: { browser, development, hotReload, maximumWorkers: "25%" },
    });
  }
});

test("keeps every port of every accepted slot distinct and within the port range", () => {
  const seen = new Set<number>();
  for (let slot = 0; slot <= 99; slot += 1) {
    const ports = successValueForTest(
      parseCheckSettings(String(slot), "The check slot"),
      "The slot is valid",
    );
    for (const port of [ports.browser, ports.development, ports.hotReload]) {
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65_535);
      expect(seen.has(port)).toBe(false);
      seen.add(port);
    }
  }
  expect(seen.size).toBe(300);
});

test("rejects a slot outside the range or with another form and names its source and value", () => {
  for (const value of [
    "100",
    "-1",
    "1.5",
    "1e1",
    "0x1",
    "+1",
    " 1",
    "1 ",
    "1\n",
    "Infinity",
    "NaN",
    "999999999999999999999999999999",
  ] as const) {
    expect(parseCheckSettings(value, "The check slot")).toEqual({
      ok: false,
      failure: `The check slot must be a whole number from 0 to 99, but it is ${JSON.stringify(value)}.`,
    });
  }
});

test("rejects an empty slot and a value that is not text", () => {
  for (const [value, description] of [
    ["", "empty"],
    [null, "null"],
    [1, "1"],
    [true, "true"],
    [[], "[]"],
    [{ slot: "1" }, '{"slot":"1"}'],
  ] as const) {
    expect(parseCheckSettings(value, "The check slot")).toEqual({
      ok: false,
      failure: `The check slot must be a whole number from 0 to 99, but it is ${description}.`,
    });
  }
});
