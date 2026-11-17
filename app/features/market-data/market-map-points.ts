import { marketIndex } from "./tracked-instruments";
import type { MapPoint, MarkedPoint } from "~/charts/layout-risk-map";
import {
  formatBeta,
  formatPercent,
  formatSignedPercent,
  formatCalendarDate,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta, marketBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ClassId } from "~/features/classes/classes.schema";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { withLessonTask } from "~/features/learning/lesson-task";
import type { LessonTask } from "~/features/learning/lesson-task";
import type { readMarket } from "./read-market.server";
import type { readMarketMap } from "./read-market-map.server";
import type { MarketRow } from "./filter-market-rows";
import type { MarketFilters } from "./market-filters";
import { marketSearch } from "./market-search";
import { marketPath } from "./market-path";
import { stockPath } from "./stock-path";
type Risk = Beta | MonthlyReturn;
type MapData = ReturnType<typeof readMarketMap>;

export function marketMapPoints({
  rows,
  map,
  reference,
  filters,
  classId,
  task,
}: {
  rows: readonly MarketRow[];
  map: MapData;
  reference: ReturnType<typeof readMarket>["marketReference"];
  filters: MarketFilters;
  classId: ClassId;
  task: LessonTask | undefined;
}) {
  const axis = {
    beta: {
      label: m.market_data_beta_label(),
      style: "decimal" as const,
      toValue: beta,
      title: m.market_data_map_beta_axis_label({
        market: formatBeta(marketBeta, 1),
      }),
      value: (risk: { beta: Beta; standardDeviation: MonthlyReturn }) =>
        risk.beta,
      format: (value: Risk) => formatBeta(beta(value)),
    },
    risk: {
      label: m.market_data_map_deviation_label(),
      style: "percent" as const,
      toValue: monthlyReturn,
      title: m.market_data_map_risk_axis_label(),
      value: (risk: { beta: Beta; standardDeviation: MonthlyReturn }) =>
        risk.standardDeviation,
      format: (value: number) => formatPercent(value, "two"),
    },
  }[filters.axis];
  const riskLabel = axis.label;
  const returnLabel = m.market_data_map_change_label();
  const point = (
    code: string,
    risk: Risk,
    change: CumulativeReturn,
  ): MapPoint<Risk, CumulativeReturn> => ({
    key: code,
    name: code,
    across: risk,
    up: change,
    values: [
      { name: riskLabel, value: axis.format(risk) },
      { name: returnLabel, value: formatSignedPercent(change) },
    ],
  });
  const points: MarkedPoint<Risk, CumulativeReturn>[] = [];
  const omitted: { row: MarketRow; reason: string }[] = [];
  const returnPath = `${marketPath(classId)}${marketSearch(filters, task)}#market-map-title`;
  for (const row of rows) {
    const change = map.changes.find((stock) => stock.code === row.code)?.change;
    const reason = omittedReason(row, change, map.from);
    if (row.measures === undefined || change === undefined) {
      if (reason !== undefined) omitted.push({ row, reason });
      continue;
    }
    points.push({
      ...point(row.code, axis.value(row.measures), change),
      href: withLessonTask(
        pathReturningTo(stockPath(classId, row.code), returnPath),
        task,
      ),
      mark: map.heldCodes.includes(row.code)
        ? { kind: "held", weight: undefined }
        : { kind: "other" },
    });
  }
  if (map.portfolio !== undefined)
    points.push({
      ...point("portfolio", axis.value(map.portfolio), map.portfolio.change),
      name: m.market_data_map_portfolio_label(),
      mark: { kind: "own" },
    });
  const marketRisk = reference.ok
    ? axis.value({
        beta: reference.value.beta.value,
        standardDeviation: reference.value.standardDeviation,
      })
    : undefined;
  const market =
    marketRisk === undefined || map.marketChange === undefined
      ? undefined
      : point(marketIndex.code, marketRisk, map.marketChange);
  return { axis, riskLabel, returnLabel, points, market, omitted, returnPath };
}

function omittedReason(
  row: MarketRow,
  change: CumulativeReturn | undefined,
  from: string,
): string | undefined {
  return (
    row.measureFailure ??
    (change === undefined
      ? m.market_data_map_no_change_notice({
          code: row.code,
          date: formatCalendarDate(from),
        })
      : undefined)
  );
}
