import { marketIndex } from "./tracked-instruments";
import type { ReactNode } from "react";
import { data } from "react-router";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { failureOf } from "~/result";
import type { Route } from "./+types/market-page";
import {
  defaultMarketFilters,
  marketRangeOptions,
  marketSortOptions,
  marketSectorOptions,
  marketDirectionOptions,
  parseMarketChoice,
  parseMarketSearch,
} from "./market-filters";
import type { MarketFilters } from "./market-filters";
import { MarketView } from "./market-view";
import { readMarket } from "./read-market.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.market_data_page_title()) }];
}

export function loader({ context, params, url }: Route.LoaderArgs) {
  const classId = requireReaderClass(context, url, params.classId);
  const fields = url.searchParams;
  const query = parseMarketSearch(
    fields.get("q"),
    m.market_data_search_label(),
  );
  const sector = parseMarketChoice(
    fields.get("sector"),
    m.market_data_sector_label(),
    { options: marketSectorOptions(), fallback: defaultMarketFilters.sector },
  );
  const sort = parseMarketChoice(
    fields.get("sort"),
    m.market_data_sort_label(),
    { options: marketSortOptions(), fallback: defaultMarketFilters.sort },
  );
  const direction = parseMarketChoice(
    fields.get("direction"),
    m.market_data_direction_label(),
    {
      options: marketDirectionOptions(),
      fallback: defaultMarketFilters.direction,
    },
  );
  const range = parseMarketChoice(
    fields.get("range"),
    m.market_data_range_label({ index: marketIndex.code }),
    { options: marketRangeOptions(), fallback: defaultMarketFilters.range },
  );
  const filters: MarketFilters = {
    query: query.ok ? query.value : "",
    sector: sector.ok ? sector.value : defaultMarketFilters.sector,
    sort: sort.ok ? sort.value : defaultMarketFilters.sort,
    direction: direction.ok ? direction.value : defaultMarketFilters.direction,
    range: range.ok ? range.value : defaultMarketFilters.range,
  };
  const failures = {
    query: failureOf(query),
    sector: failureOf(sector),
    sort: failureOf(sort),
    direction: failureOf(direction),
    range: failureOf(range),
  };
  return data(
    {
      classId,
      ...readMarket(context, new Date(), filters.range),
      filters,
      values: {
        ...filters,
        query: fields.get("q") ?? filters.query,
        sector: fields.get("sector") ?? filters.sector,
        sort: fields.get("sort") ?? filters.sort,
        direction: fields.get("direction") ?? filters.direction,
        range: fields.get("range") ?? filters.range,
      },
      failures,
    },
    {
      status: Object.values(failures).some((failure) => failure !== undefined)
        ? 400
        : 200,
    },
  );
}

export default function MarketPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <MarketView key={JSON.stringify(loaderData.values)} {...loaderData} />;
}
