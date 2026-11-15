import { annotationPosition } from "./annotation-position";
import type { PlotFraction } from "~/units/plot-fraction";

export interface TimeEvent {
  date: string;
  label: string;
}

/** Course dates use the same positions on every time chart, with fewer labels on a phone. */
export function placeTimeEvents(
  dates: readonly string[],
  events: readonly TimeEvent[],
): { at: PlotFraction; label: string; minor: boolean }[] {
  const points = dates.map((date) => ({ date }));
  const placed: { at: PlotFraction; label: string; minor: boolean }[] = [];
  for (const event of events) {
    const at = annotationPosition(points, event.date);
    if (at !== undefined)
      placed.push({
        at,
        label: event.label,
        minor: placed.length % 3 !== 0,
      });
  }
  return placed;
}
