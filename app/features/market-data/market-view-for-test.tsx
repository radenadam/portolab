import type { ComponentProps } from "react";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { defaultMarketFilters } from "./market-filters";
import { marketContextForTest } from "./market-context-for-test.server";
import { MarketView } from "./market-view";
import { readMarket } from "./read-market.server";

type Props = ComponentProps<typeof MarketView>;

export function renderMarketForTest(
  props: Props,
  overrides: Partial<Props> = {},
): string {
  return renderInRouterForTest(
    <MarketView {...props} {...overrides} />,
    conceptLessonDataForTest(),
    "/classes/1/market",
  )
    .replaceAll("&quot;", '"')
    .replaceAll(/<\/?span\b[^>]*>/g, "");
}

export async function marketViewPropsForTest(): Promise<Props> {
  return {
    ...readMarket(
      await marketContextForTest(),
      new Date("2026-11-14T00:00:00.000Z"),
      "3m",
    ),
    classId: 1 as ClassId,
    filters: defaultMarketFilters,
    values: defaultMarketFilters,
    failures: {
      query: undefined,
      sector: undefined,
      sort: undefined,
      direction: undefined,
      range: undefined,
    },
  };
}
