import { acrossOf } from "./time-chart-layout";
import type { PlotFraction } from "~/units/plot-fraction";

export interface TimeEvent {
  date: string;
  label: string;
}

/** A meeting without a close stands at the first close after it. Events outside the history stay outside the plot. */
export function placeTimeEvents(
  dates: readonly string[],
  events: readonly TimeEvent[],
): { at: PlotFraction; label: string; minor: boolean }[] {
  const first = dates.at(0);
  const placed: { at: PlotFraction; label: string; minor: boolean }[] = [];
  if (first === undefined) return placed;
  for (const event of events) {
    if (event.date < first) continue;
    const index = dates.findIndex((date) => date >= event.date);
    if (index !== -1)
      placed.push({
        at: acrossOf(index, dates.length),
        label: event.label,
        minor: placed.length % 3 !== 0,
      });
  }
  return placed;
}
