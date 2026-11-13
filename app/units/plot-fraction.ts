/** A position across or down the plot of a chart as a fraction of its width or of its height, from 0 at its left or top edge to 1 at its right or bottom edge. The browser turns it into pixels at whatever size the plot has, so the server draws a chart without knowing the width of the screen. Its own type keeps it apart from the values that a chart places and from lengths in pixels. */
export type PlotFraction = number & { readonly brand: "PlotFraction" };

function isPlotFraction(value: number): value is PlotFraction {
  return Number.isFinite(value);
}

/** Makes a position that a chart computed into a fraction of the plot. A chart computes every position from finite values in a range that it chose, so a value that is not finite is a defect. */
export function plotFraction(value: number): PlotFraction {
  if (!isPlotFraction(value)) {
    throw new Error(`${String(value)} is not a position in a plot.`);
  }
  return value;
}
