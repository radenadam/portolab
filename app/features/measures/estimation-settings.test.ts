import { expect, test } from "vitest";
import {
  defaultEstimationSettings,
  earliestCloseDate,
} from "./estimation-settings";

test("goes back two months more than the monthly returns, to the first day of that month", () => {
  // On 1 November 2026, the window can end in September, and its first return then starts from the close of September 2021.
  expect(earliestCloseDate(defaultEstimationSettings, "2026-11-01")).toBe(
    "2021-09-01",
  );
  expect(
    earliestCloseDate(
      { returnCount: 12, minimumReturnCount: 12 },
      "2026-11-30",
    ),
  ).toBe("2025-09-01");
});
