import { marketMapCorners } from "./market-map-corners";
import { marketIndex } from "./tracked-instruments";
import { marketMapRangeText } from "./market-map-range-text";
import { marketMapPoints } from "./market-map-points";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import { MapCorners, mapCornerLabels } from "~/charts/map-corners";
import { NumberText } from "~/number-text";
import { ChangeText } from "~/change-text";
import {
  formatSignedPercent,
  formatCalendarDate,
  formatList,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { ClassId } from "~/features/classes/classes.schema";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { withLessonTask } from "~/features/learning/lesson-task";
import type { LessonTask } from "~/features/learning/lesson-task";
import type { readMarket } from "./read-market.server";
import type { readMarketMap } from "./read-market-map.server";
import type { MarketRow } from "./filter-market-rows";
import { marketRangeOptions, marketAxisOptions } from "./market-filters";
import type { MarketFilters } from "./market-filters";
import { marketSearch } from "./market-search";
import { stockPath } from "./stock-path";
import { QuoteTime } from "./quote-time";
import styles from "./market-map.module.css";

type MapData = ReturnType<typeof readMarketMap>;

export function MarketMap({
  rows,
  map,
  reference,
  filters,
  classId,
  task,
  sharedTime,
  failed,
}: {
  rows: readonly MarketRow[];
  map: MapData | undefined;
  reference: ReturnType<typeof readMarket>["marketReference"];
  filters: MarketFilters;
  classId: ClassId;
  task: LessonTask | undefined;
  sharedTime: Date | undefined;
  failed: ReadonlySet<string>;
}): ReactNode {
  if (map === undefined) return null;
  const { axis, riskLabel, returnLabel, points, market, omitted, returnPath } =
    marketMapPoints({ rows, map, reference, filters, classId, task });
  const corners = marketMapCorners();
  return (
    <section
      className={styles["panel"]}
      aria-labelledby="market-map-title"
      data-layout="panel"
    >
      <div className={styles["header"]}>
        <h2 id="market-map-title">{m.market_data_map_title()}</h2>
        <nav
          className={styles["ranges"]}
          aria-label={m.market_data_map_range_label()}
        >
          {marketRangeOptions().map(({ value, label }) => (
            <Link
              key={value}
              to={marketSearch({ ...filters, mapRange: value }, task)}
              aria-current={filters.mapRange === value ? "true" : undefined}
              preventScrollReset
            >
              {label}
            </Link>
          ))}
        </nav>
        <nav
          className={styles["axis"]}
          aria-label={m.market_data_map_axis_label()}
        >
          {marketAxisOptions().map(({ value, label }) => (
            <Link
              key={value}
              to={marketSearch({ ...filters, axis: value }, task)}
              aria-current={filters.axis === value ? "true" : undefined}
              preventScrollReset
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles["keys"]}>
        <RiskMapLegend
          items={[
            { kind: "held", name: m.market_data_map_held_label() },
            { kind: "other", name: m.market_data_map_other_label() },
            ...(map.portfolio === undefined
              ? []
              : [
                  {
                    kind: "own" as const,
                    name: m.market_data_map_portfolio_label(),
                  },
                ]),
            { kind: "market", name: marketIndex.code },
          ]}
        />
        <p>
          {m.market_data_map_vertical_notice({
            range: marketMapRangeText(filters.mapRange),
          })}
        </p>
      </div>
      {market === undefined ? (
        <p>
          <NumberText>
            {reference.ok
              ? m.market_data_map_no_change_notice({
                  code: marketIndex.code,
                  date: formatCalendarDate(map.from),
                })
              : reference.failure}
          </NumberText>
        </p>
      ) : (
        <RiskMap
          market={market}
          points={points}
          across={axis}
          up={{ style: "percent", toValue: cumulativeReturn }}
          labelledBy="market-map-title"
          coloredValues
          levelLabel={m.app_map_value_part({
            name: marketIndex.code,
            value: formatSignedPercent(market.up).text,
          })}
          annotations={{
            labels: mapCornerLabels(corners),
            drawing: (placed) => (
              <MapCorners corners={corners} placed={placed} />
            ),
          }}
        />
      )}
      <details className={styles["details"]}>
        <summary>{m.market_data_map_points_label()}</summary>
        <p>{m.market_data_map_weights_notice()}</p>
        {map.portfolioFailure !== undefined && map.heldCodes.length > 0 && (
          <p>
            <NumberText>{map.portfolioFailure}</NumberText>
          </p>
        )}
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th scope="col">{m.market_data_stock_label()}</th>
              <th scope="col">{riskLabel}</th>
              <th scope="col">{returnLabel}</th>
            </tr>
          </thead>
          <tbody>
            {[...(market === undefined ? [] : [market]), ...points].map(
              (item) => {
                const quote = rows.find((row) => row.code === item.key)?.quote;
                return (
                  <tr key={item.key}>
                    <th scope="row">
                      {item.href === undefined ? (
                        item.name
                      ) : (
                        <Link className={styles["link"]} to={item.href}>
                          {item.name}
                        </Link>
                      )}
                      {quote !== undefined && (
                        <QuoteTime
                          quotedAt={quote.quotedAt}
                          sharedTime={sharedTime}
                        />
                      )}
                      {failed.has(item.key) && (
                        <span>{m.market_data_missed_label()}</span>
                      )}
                    </th>
                    <td>
                      <NumberText>{axis.format(item.across)}</NumberText>
                    </td>
                    <td>
                      <ChangeText
                        colored
                        change={formatSignedPercent(item.up)}
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </details>
      <MarketMapOmissions
        omitted={omitted}
        classId={classId}
        returnPath={returnPath}
        task={task}
      />
    </section>
  );
}

function MarketMapOmissions({
  omitted,
  classId,
  returnPath,
  task,
}: {
  omitted: ReturnType<typeof marketMapPoints>["omitted"];
  classId: ClassId;
  returnPath: string;
  task: LessonTask | undefined;
}): ReactNode {
  if (omitted.length === 0) return null;
  const reasons = new Map<string, string[]>();
  for (const { row, reason } of omitted) {
    const codes = reasons.get(reason) ?? [];
    codes.push(row.code);
    reasons.set(reason, codes);
  }
  return (
    <div className={styles["omitted"]}>
      <h3>{m.market_data_map_omitted_title()}</h3>
      <ul>
        {omitted.map(({ row }) => (
          <li key={row.code}>
            <Link
              className={styles["link"]}
              to={withLessonTask(
                pathReturningTo(stockPath(classId, row.code), returnPath),
                task,
              )}
            >
              {row.code}
            </Link>
          </li>
        ))}
      </ul>
      <details>
        <summary>{m.market_data_map_omissions_label()}</summary>
        <dl>
          {[...reasons].map(([reason, codes]) => (
            <div key={reason}>
              <dt>{formatList(codes, "conjunction")}</dt>
              <dd>
                <NumberText>{reason}</NumberText>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
