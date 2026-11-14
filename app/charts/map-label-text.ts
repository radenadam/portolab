import type { DrawnPoint } from "./map-drawing";

/** The drawing and placing must share keys to join each text with its position. */
export const mapLineLabelKeys = {
  level: "level",
  line: "line",
  zero: "zero",
  median: "median",
  corners: ["corner0", "corner1", "corner2", "corner3"],
} as const;

/** Decision 0035 keeps the reader's names even when a caller hides its other labels. */
export function mapPointName({
  point,
  kind,
}: Pick<DrawnPoint, "point" | "kind">): string {
  switch (kind) {
    case "own":
    case "held":
      return point.name;
    case "market":
    case "active":
    case "other":
      return point.label ?? point.name;
  }
}
