import type { FieldOption } from "~/form";
import { m } from "~/paraglide/messages.js";
import { failureOf } from "~/result";
import { marketIndex } from "./tracked-instruments";
import {
  defaultMarketFilters,
  marketRangeOptions,
  marketSortOptions,
  marketSectorOptions,
  marketDirectionOptions,
  marketViewOptions,
  marketAxisOptions,
  parseMarketChoice,
  parseMarketSearch,
} from "./market-filters";
import type { MarketFilters } from "./market-filters";

export function readMarketFilters(fields: URLSearchParams) {
  const choose = <Key extends Exclude<keyof MarketFilters, "query">>(
    name: Key,
    label: string,
    options: readonly FieldOption<MarketFilters[Key]>[],
  ) => {
    const result = parseMarketChoice(fields.get(name), label, {
      options,
      fallback: defaultMarketFilters[name],
    });
    const value = result.ok ? result.value : defaultMarketFilters[name];
    return {
      value,
      text: fields.get(name) ?? value,
      failure: failureOf(result),
    };
  };
  const query = parseMarketSearch(
    fields.get("q"),
    m.market_data_search_label(),
  );
  const sector = choose(
    "sector",
    m.market_data_sector_label(),
    marketSectorOptions(),
  );
  const sort = choose("sort", m.market_data_sort_label(), marketSortOptions());
  const direction = choose(
    "direction",
    m.market_data_direction_label(),
    marketDirectionOptions(),
  );
  const range = choose(
    "range",
    m.market_data_range_label({ index: marketIndex.code }),
    marketRangeOptions(),
  );
  const view = choose("view", m.market_data_view_label(), marketViewOptions());
  const axis = choose(
    "axis",
    m.market_data_map_axis_label(),
    marketAxisOptions(),
  );
  const mapRange = choose(
    "mapRange",
    m.market_data_map_range_label(),
    marketRangeOptions(),
  );
  const filters: MarketFilters = {
    query: query.ok ? query.value : "",
    sector: sector.value,
    sort: sort.value,
    direction: direction.value,
    range: range.value,
    view: view.value,
    axis: axis.value,
    mapRange: mapRange.value,
  };
  return {
    filters,
    values: {
      query: fields.get("q") ?? filters.query,
      sector: sector.text,
      sort: sort.text,
      direction: direction.text,
      range: range.text,
      view: view.text,
      axis: axis.text,
      mapRange: mapRange.text,
    },
    failures: {
      query: failureOf(query),
      sector: sector.failure,
      sort: sort.failure,
      direction: direction.failure,
      range: range.failure,
      view: view.failure,
      axis: axis.failure,
      mapRange: mapRange.failure,
    },
  };
}
