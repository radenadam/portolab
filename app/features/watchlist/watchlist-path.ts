import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

export const watchlistOperations = ["add", "remove"] as const;
export type WatchlistOperation = (typeof watchlistOperations)[number];

/** Whether the stock is watched after each operation of its star. */
export const watchedAfter: Record<WatchlistOperation, boolean> = {
  add: true,
  remove: false,
};

export function watchlistPath(
  classId: ClassId,
  code: string,
  operation: WatchlistOperation,
): string {
  return `${classPath(classId)}/watchlist/${encodeURIComponent(code)}/${operation}`;
}
