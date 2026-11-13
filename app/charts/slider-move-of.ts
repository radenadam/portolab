/** What a key does to the point that a chart marks, such as a date of a chart over time or a point of a map. It marks the point of an index, or it hides the mark, or the chart leaves the key to the page. */
export type SliderMove =
  { kind: "mark"; index: number } | { kind: "hide" } | { kind: "ignore" };

/** The move of the mark for a key, as the keys of a slider move it over the points of a chart in their order. An arrow to the right or up marks the next point, an arrow to the left or down the point before, Home the first point, and End the last. While no point is marked, an arrow marks the resting point, which the slider reads until a reader marks another, such as the latest date. Escape hides the mark, which a reader may need to see the drawing under its tooltip. */
export function sliderMoveOf(
  key: string,
  slider: { marked: number | undefined; resting: number; count: number },
): SliderMove {
  const { marked, resting, count } = slider;
  const last = count - 1;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return markAt(
        marked === undefined ? resting : Math.min(last, marked + 1),
      );
    case "ArrowLeft":
    case "ArrowDown":
      return markAt(marked === undefined ? resting : Math.max(0, marked - 1));
    case "Home":
      return markAt(0);
    case "End":
      return markAt(last);
    case "Escape":
      // A chart without a mark leaves Escape to the page, such as to a sheet around the chart.
      return marked === undefined ? { kind: "ignore" } : { kind: "hide" };
    default:
      return { kind: "ignore" };
  }
}

function markAt(index: number): SliderMove {
  return { kind: "mark", index };
}
