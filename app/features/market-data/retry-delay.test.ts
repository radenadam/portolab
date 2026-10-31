import { expect, test } from "vitest";
import { retryDelayMinutes } from "./retry-delay";

test("doubles the wait after each failure in a row, up to 30 minutes", () => {
  const delays: number[] = [];
  for (let failures = 1; failures <= 7; failures += 1) {
    delays.push(retryDelayMinutes(failures));
  }
  expect(delays).toEqual([1, 2, 4, 8, 16, 30, 30]);
});
