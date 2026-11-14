import { expect, test } from "vitest";
import { placeTimeEvents } from "./place-time-events";

test("places meetings at their close or the first following close, within the history", () => {
  expect(
    placeTimeEvents(
      ["2026-10-26", "2026-10-28", "2026-10-30"],
      [
        { date: "2026-10-25", label: "before" },
        { date: "2026-10-26", label: "first" },
        { date: "2026-10-27", label: "gap" },
        { date: "2026-10-30", label: "last" },
        { date: "2026-10-31", label: "after" },
      ],
    ),
  ).toEqual([
    { at: 0, label: "first", minor: false },
    { at: 0.5, label: "gap", minor: true },
    { at: 1, label: "last", minor: true },
  ]);
  expect(placeTimeEvents([], [{ date: "2026-10-26", label: "empty" }])).toEqual(
    [],
  );
});
