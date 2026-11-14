import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";
import { acrossOf } from "./time-chart-layout";

/** A session between trading days keeps its date between their evenly spaced marks, including weekends. */
export function annotationPosition(
  points: readonly { date: string }[],
  date: string,
): PlotFraction | undefined {
  const first = points[0];
  const latest = points.at(-1);
  if (
    first === undefined ||
    latest === undefined ||
    date < first.date ||
    date > latest.date
  )
    return undefined;
  const after = points.findIndex((point) => point.date >= date);
  const point = points[after];
  if (point?.date === date) return acrossOf(after, points.length);
  const before = points[after - 1];
  if (before === undefined || point === undefined) return undefined;
  const share =
    (Date.parse(date) - Date.parse(before.date)) /
    (Date.parse(point.date) - Date.parse(before.date));
  return plotFraction(
    acrossOf(after - 1, points.length) +
      share *
        (acrossOf(after, points.length) - acrossOf(after - 1, points.length)),
  );
}
