import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { companyOf } from "./company-of";
import type { MarketFilters, MarketSort } from "./market-filters";
import type { StockQuote } from "./price-source.server";
import { quoteChange } from "./quote-change";

export interface MarketRow {
  code: string;
  quote: StockQuote | undefined;
  closes: readonly SplitAdjustedRupiah[];
  measures: { beta: Beta; standardDeviation: MonthlyReturn } | undefined;
  measureFailure: string | undefined;
}

const directions: Record<MarketFilters["direction"], number> = {
  descending: -1,
  ascending: 1,
};

export function filterMarketRows(
  rows: readonly MarketRow[],
  filters: MarketFilters,
): MarketRow[] {
  // A device can use another language than Portolab, so search must use the same casing in the server and browser.
  const query = filters.query.trim().toLowerCase();
  return rows
    .filter((row) => {
      const company = companyOf(row.code);
      return (
        (filters.sector === "all" || company.sector === filters.sector) &&
        (row.code.toLowerCase().includes(query) ||
          company.name.toLowerCase().includes(query))
      );
    })
    .toSorted((first, second) => {
      const firstValue = sortValue(first, filters.sort);
      const secondValue = sortValue(second, filters.sort);
      if (firstValue === undefined)
        return secondValue === undefined
          ? first.code.localeCompare(second.code)
          : 1;
      if (secondValue === undefined) return -1;
      const comparison =
        typeof firstValue === "string" && typeof secondValue === "string"
          ? firstValue.localeCompare(secondValue)
          : Number(firstValue) - Number(secondValue);
      return (
        directions[filters.direction] * comparison ||
        first.code.localeCompare(second.code)
      );
    });
}

function sortValue(
  row: MarketRow,
  sort: MarketSort,
): string | number | undefined {
  switch (sort) {
    case "code":
      return row.code;
    case "price":
      return row.quote?.price;
    case "change":
      return row.quote === undefined ? undefined : quoteChange(row.quote);
    case "beta":
      return row.measures?.beta;
    case "volatility":
      return row.measures?.standardDeviation;
  }
}
