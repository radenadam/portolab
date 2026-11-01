import { expect, test } from "vitest";
import { startOfWibDate, wibDateOf, wibMinuteOfDay } from "./wib";

test("dates a moment by its day in WIB, which starts at 17:00 UTC of the day before", () => {
  expect(wibDateOf(new Date("2026-10-30T16:59:59.999Z"))).toBe("2026-10-30");
  expect(wibDateOf(new Date("2026-10-30T17:00:00.000Z"))).toBe("2026-10-31");
  expect(startOfWibDate("2026-10-31")).toEqual(
    new Date("2026-10-30T17:00:00.000Z"),
  );
});

test("counts the minutes since midnight in WIB", () => {
  // 09:15 UTC is 16:15 WIB.
  expect(wibMinuteOfDay(new Date("2026-10-30T09:15:30.000Z"))).toBe(975);
  expect(wibMinuteOfDay(new Date("2026-10-30T17:00:00.000Z"))).toBe(0);
});
