import { expect, test } from "vitest";
import { sliderMoveOf } from "./slider-move-of";
import type { SliderMove } from "./slider-move-of";

// A slider of five points, which reads the point at index 1 while no point is marked, as a map reads the point of the reader.
function moves(key: string, marked: number | undefined): SliderMove {
  return sliderMoveOf(key, { marked, resting: 1, count: 5 });
}

test("moves the mark along the points with the keys of a slider, from the resting point while no point is marked, and stops at the first and the last point", () => {
  for (const key of ["ArrowRight", "ArrowUp"]) {
    expect(moves(key, 2)).toEqual({ kind: "mark", index: 3 });
    expect(moves(key, 4)).toEqual({ kind: "mark", index: 4 });
    expect(moves(key, undefined)).toEqual({ kind: "mark", index: 1 });
  }
  for (const key of ["ArrowLeft", "ArrowDown"]) {
    expect(moves(key, 2)).toEqual({ kind: "mark", index: 1 });
    expect(moves(key, 0)).toEqual({ kind: "mark", index: 0 });
    expect(moves(key, undefined)).toEqual({ kind: "mark", index: 1 });
  }
  expect(moves("Home", 3)).toEqual({ kind: "mark", index: 0 });
  expect(moves("End", 1)).toEqual({ kind: "mark", index: 4 });
  expect(moves("Home", undefined)).toEqual({ kind: "mark", index: 0 });
  expect(moves("End", undefined)).toEqual({ kind: "mark", index: 4 });
});

test("hides a mark with Escape, and leaves Escape without a mark and every other key to the page", () => {
  expect(moves("Escape", 2)).toEqual({ kind: "hide" });
  expect(moves("Escape", undefined)).toEqual({ kind: "ignore" });
  for (const key of ["Tab", "Enter", " ", "PageUp", "a"]) {
    expect(moves(key, 2)).toEqual({ kind: "ignore" });
  }
});
