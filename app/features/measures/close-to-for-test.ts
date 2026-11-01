import { expect } from "vitest";

/** Matches a number within the last digits of an expected value, such as one that Python computed with more digits than a double holds, inside an object that a test compares as a whole. */
export function closeToForTest(expected: number, digits: number): number {
  return expect.closeTo(expected, digits) as number;
}
