import { useState } from "react";
import type { HTMLAttributes } from "react";
import { sliderMoveOf } from "./slider-move-of";

/** The state of a chart that a reader explores as a slider over its points, such as the dates of a chart over time or the points of a map, in their order. The marked point is undefined until a reader marks one, and the slider reads the resting point until then. Focus marks the resting point, leaving the slider hides the mark, and a pointer that leaves it hides the mark too, while a finger that lifts leaves the mark where it was, so the reader can read its tooltip. A pointer or a finger marks a point through setMarked. */
export function useChartSlider(slider: {
  count: number;
  resting: number;
  labelledBy: string;
}): {
  marked: number | undefined;
  shown: number;
  setMarked: (index: number | undefined) => void;
  /** The attributes and the handlers of the element of the slider, which a screen reader reads by the text of the shown point. */
  sliderProps: (valueText: string) => HTMLAttributes<HTMLDivElement>;
} {
  const { count, resting, labelledBy } = slider;
  const [marked, setMarked] = useState<number | undefined>(undefined);
  const shown = marked ?? resting;
  return {
    marked,
    shown,
    setMarked,
    sliderProps: (valueText) => ({
      role: "slider",
      tabIndex: 0,
      "aria-labelledby": labelledBy,
      "aria-valuemin": 0,
      "aria-valuemax": count - 1,
      "aria-valuenow": shown,
      "aria-valuetext": valueText,
      onFocus: () => {
        setMarked((current) => current ?? resting);
      },
      onBlur: () => {
        setMarked(undefined);
      },
      onKeyDown: (event) => {
        const move = sliderMoveOf(event.key, { marked, resting, count });
        switch (move.kind) {
          case "mark":
            event.preventDefault();
            setMarked(move.index);
            return;
          case "hide":
            event.preventDefault();
            setMarked(undefined);
            return;
          case "ignore":
            return;
        }
      },
      onPointerLeave: (event) => {
        if (event.pointerType === "mouse") {
          setMarked(undefined);
        }
      },
    }),
  };
}
