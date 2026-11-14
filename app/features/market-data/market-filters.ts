import type { FieldOption } from "~/form";
import { checkFieldLengthForReader, typedText } from "~/form-text";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { priceChartRangeOptions } from "./price-chart-range";
import type { PriceChartRange } from "./price-chart-range";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";
import { sectors } from "./company-of";
import type { Sector } from "./company-of";
import { sectorNames } from "./sector-names";

export const marketSorts = [
  "change",
  "price",
  "beta",
  "volatility",
  "code",
] as const;
export type MarketSort = (typeof marketSorts)[number];
export type MarketRange = Exclude<PriceChartRange, "5y">;
export interface MarketFilters {
  query: string;
  sector: Sector | "all";
  sort: MarketSort;
  direction: "descending" | "ascending";
  range: MarketRange;
}
export const defaultMarketFilters: MarketFilters = {
  query: "",
  sector: "all",
  sort: "change",
  direction: "descending",
  range: "3m",
};

/** The size guard must run before search normalization because its work grows with the text. */
export function parseMarketSearch(
  value: unknown,
  source: string,
): Result<string, string> {
  if (value === null) return succeed("");
  if (typeof value !== "string")
    return fail(m.app_not_text_error({ field: source, type: typeName(value) }));
  return checkFieldLengthForReader(value, source);
}

export function parseMarketChoice<Value extends string>(
  value: unknown,
  source: string,
  {
    options,
    fallback,
  }: { options: readonly FieldOption<Value>[]; fallback: Value },
): Result<Value, string> {
  const text = parseMarketSearch(value, source);
  if (!text.ok) return text;
  if (value === null) return succeed(fallback);
  const chosen = options.find((option) => option.value === text.value);
  return chosen === undefined
    ? fail(
        m.market_data_filter_error({
          field: source,
          value: typedText(value).trim(),
          choices: formatList(
            options.map((option) => option.label),
            "disjunction",
          ),
        }),
      )
    : succeed(chosen.value);
}

const sortLabels: Record<MarketSort, () => string> = {
  change: m.market_data_change_label,
  price: m.market_data_last_label,
  beta: m.market_data_beta_label,
  volatility: m.market_data_volatility_label,
  code: m.market_data_code_label,
};
export function marketSortOptions(): FieldOption<MarketSort>[] {
  return marketSorts.map((value) => ({ value, label: sortLabels[value]() }));
}
export function marketRangeOptions(): FieldOption<MarketRange>[] {
  return priceChartRangeOptions().flatMap(({ value, label }) =>
    value === "5y" ? [] : [{ value, label }],
  );
}
export function marketSectorOptions(): FieldOption<Sector | "all">[] {
  return [
    { value: "all", label: m.market_data_all_label() },
    ...sectors.map((value) => ({ value, label: sectorNames[value]() })),
  ];
}
export function marketDirectionOptions(): FieldOption<
  MarketFilters["direction"]
>[] {
  return [
    { value: "descending", label: m.market_data_descending_label() },
    { value: "ascending", label: m.market_data_ascending_label() },
  ];
}
