import { readMarketFilters } from "./read-market-filters";
import { readLessonTask } from "~/features/learning/read-lesson-task.server";
import type { ReactNode } from "react";
import { data } from "react-router";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/market-page";
import { MarketView } from "./market-view";
import { readMarket } from "./read-market.server";
import { readMarketMap } from "./read-market-map.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.market_data_page_title()) }];
}

export function loader({ context, params, url, request }: Route.LoaderArgs) {
  const now = new Date();
  const classId = requireReaderClass(context, url, params.classId);
  const { filters, values, failures } = readMarketFilters(url.searchParams);
  return data(
    {
      classId,
      task: readLessonTask(url),
      ...readMarket(context, now, filters.range),
      map:
        filters.view === "map"
          ? readMarketMap(
              context,
              { request, url, classId: params.classId, now },
              filters.mapRange,
            )
          : undefined,
      filters,
      values,
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
