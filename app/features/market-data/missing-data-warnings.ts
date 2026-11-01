import { wibDateOf } from "~/wib";
import { isPriceUpdateTime } from "./idx-calendar";
import { universeOn } from "./tracked-instruments";

/** The warnings about missing data at a moment: a date that no IDX calendar covers, and a trading day that no recorded period of the LQ45 covers. The universe changes only between trading days, so a missing period matters only while prices can change. */
export function missingDataWarnings(
  moment: Date,
  delayMinutes: number,
): string[] {
  const updateTime = isPriceUpdateTime(moment, delayMinutes);
  if (!updateTime.ok) {
    return [updateTime.failure];
  }
  if (!updateTime.value) {
    return [];
  }
  const universe = universeOn(wibDateOf(moment));
  return universe.ok ? [] : [universe.failure];
}
