import type { ComponentProps } from "react";
import type { RouterContextProvider } from "react-router";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { defaultMarketFilters } from "./market-filters";
import { marketContextForTest } from "./market-context-for-test.server";
import { MarketView } from "./market-view";
import { readMarket } from "./read-market.server";
import { marketRowId } from "./market-row-id";
import type { MarketRowPrefix } from "./market-row-id";

type Props = ComponentProps<typeof MarketView>;

export function marketRowForTest(
  html: string,
  code: string,
  prefix: MarketRowPrefix = "stock",
): string {
  const row = new RegExp(
    `<tr[^>]*id="${marketRowId(prefix, code)}"[^>]*>(.*?)</tr>`,
  ).exec(html)?.[1];
  if (row === undefined)
    throw new Error(`The market row of ${code} is missing.`);
  return row;
}

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

export async function marketViewPropsForTest(
  context?: Readonly<RouterContextProvider>,
): Promise<Props> {
  return {
    ...readMarket(
      context ?? (await marketContextForTest()),
      new Date("2026-11-14T00:00:00.000Z"),
      "3m",
    ),
    classId: 1 as ClassId,
    watchedCodes: [],
    filters: defaultMarketFilters,
    values: defaultMarketFilters,
    failures: {
      query: undefined,
      sector: undefined,
      sort: undefined,
      direction: undefined,
      range: undefined,
      view: undefined,
      axis: undefined,
      mapRange: undefined,
    },
  };
}
