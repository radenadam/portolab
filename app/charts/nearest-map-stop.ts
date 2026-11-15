import type { DrawnPoint } from "./map-drawing";
import { markReach } from "./map-drawing";

// A point answers a pointer or a finger within this distance of its center, in sizes of the text of the labels, or within the reach of its mark when that is larger.
const pointerReach = 0.83;
// The drawing rounds positions, so distances within this fraction of a text size can belong to coincident marks. The reader's portfolio keeps priority there.
const tieReach = 0.01;

export function nearestMapStop(
  stops: readonly DrawnPoint[],
  pointer: {
    event: { clientX: number; clientY: number };
    area: HTMLDivElement;
    textSize: number;
  },
): number | undefined {
  const box = pointer.area.getBoundingClientRect();
  let nearest: { index: number; distance: number } | undefined;
  for (const [index, { placed, kind }] of stops.entries()) {
    const distance =
      Math.hypot(
        placed.position.x * box.width - (pointer.event.clientX - box.left),
        placed.position.y * box.height - (pointer.event.clientY - box.top),
      ) / pointer.textSize;
    const reach = Math.max(pointerReach, placed.outerRadius + markReach);
    if (
      distance <= reach &&
      (nearest === undefined ||
        distance + tieReach < nearest.distance ||
        (Math.abs(distance - nearest.distance) <= tieReach && kind === "own"))
    ) {
      nearest = { index, distance };
    }
  }
  return nearest?.index;
}
