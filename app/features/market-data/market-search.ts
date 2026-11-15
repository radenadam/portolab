import type { MarketFilters } from "./market-filters";

/** Search padding changes no result, so omitting it keeps a stock's return field small even after a padded search. */
export function marketSearch(filters: MarketFilters): string {
  return `?${new URLSearchParams({ q: filters.query.trim(), sector: filters.sector, sort: filters.sort, direction: filters.direction, range: filters.range }).toString()}`;
}
