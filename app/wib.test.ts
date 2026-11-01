import { expect, test } from "vitest";
import { wibDateOf, wibMinuteOfDay, wibMoment } from "./wib";

test("dates a moment by its day in WIB, which starts at 17:00 UTC of the day before", () => {
  expect(wibDateOf(new Date("2026-10-30T16:59:59.999Z"))).toBe("2026-10-30");
  expect(wibDateOf(new Date("2026-10-30T17:00:00.000Z"))).toBe("2026-10-31");
});

test("counts the minutes since midnight in WIB", () => {
  // 09:15 UTC is 16:15 WIB.
  expect(wibMinuteOfDay(new Date("2026-10-30T09:15:30.000Z"))).toBe(975);
  expect(wibMinuteOfDay(new Date("2026-10-30T17:00:00.000Z"))).toBe(0);
});

test("finds the moment of a minute of a date in WIB", () => {
  expect(wibMoment("2026-10-31", 0)).toEqual(
    new Date("2026-10-30T17:00:00.000Z"),
  );
  expect(wibMoment("2026-10-30", 975)).toEqual(
    new Date("2026-10-30T09:15:00.000Z"),
  );
});
