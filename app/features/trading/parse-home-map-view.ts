import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeValue } from "~/value-shapes";

export type HomeMapView = "map" | "time";

/** A missing choice opens the map. */
export function parseHomeMapView(
  value: unknown,
  source: string,
): Result<HomeMapView, string> {
  if (value === null || value === "map") return succeed("map");
  if (value === "time") return succeed("time");
  return fail(
    `${source} must be "map" or "time", but it is ${describeValue(value)}.`,
  );
}
