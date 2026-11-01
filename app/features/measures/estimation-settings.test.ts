import { expect, test } from "vitest";
import { earliestCloseDate } from "./estimation-settings";

test("goes back two months more than the monthly returns, to the first day of that month", () => {
  // On 1 November 2026, the window can end in September, and its first return then starts from the close of September 2021.
  expect(
    earliestCloseDate(
      { frequency: "monthly", returnCount: 60, minimumReturnCount: 24 },
      "2026-11-01",
    ),
  ).toBe("2021-09-01");
});

test("goes back two weeks more than the weekly returns, to the Monday of that week", () => {
  // Friday 30 October 2026 is in the week of Monday 26 October, and 106 weeks before that Monday is Monday 14 October 2024.
  expect(
    earliestCloseDate(
      { frequency: "weekly", returnCount: 104, minimumReturnCount: 52 },
      "2026-10-30",
    ),
  ).toBe("2024-10-14");
});
