import { expect, test } from "vitest";
import { latestQuoteTime } from "./latest-quote-time";

test("gives the time of the newest quote, whatever their order, and none without quotes", () => {
  const friday = new Date("2026-10-30T09:14:55Z");
  const monday = new Date("2026-11-02T03:00:00Z");
  expect(latestQuoteTime([{ quotedAt: friday }, { quotedAt: monday }])).toBe(
    monday,
  );
  expect(latestQuoteTime([{ quotedAt: monday }, { quotedAt: friday }])).toBe(
    monday,
  );
  expect(latestQuoteTime([])).toBeUndefined();
});
