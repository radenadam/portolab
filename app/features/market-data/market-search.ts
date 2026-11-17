import type { MarketFilters } from "./market-filters";
import type { LessonTask } from "~/features/learning/lesson-task";
import { withLessonTask } from "~/features/learning/lesson-task";

/** Search padding changes no result, so omitting it keeps a stock's return field small even after a padded search. */
export function marketSearch(
  filters: MarketFilters,
  task?: LessonTask,
): string {
  return withLessonTask(
    `?${new URLSearchParams({ q: filters.query.trim(), sector: filters.sector, sort: filters.sort, direction: filters.direction, range: filters.range, view: filters.view, axis: filters.axis, mapRange: filters.mapRange }).toString()}`,
    task,
  );
}
