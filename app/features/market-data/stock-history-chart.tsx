import type { ReactNode } from "react";
import { Link } from "react-router";
import { layoutTimeSeries } from "~/charts/time-chart-layout";
import { TimeSeriesChart } from "~/charts/time-chart";
import {
  formatNumber,
  smallestNumberStep,
  formatCalendarDatePart,
  formatCalendarDate,
  formatSplitAdjustedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { StockHistory } from "./price-source.server";
import { priceChartRangeOptions } from "./price-chart-range";
import type { PriceChartRange } from "./price-chart-range";
import styles from "./stock-history-chart.module.css";

const dateParts: Record<
  PriceChartRange,
  Parameters<typeof formatCalendarDatePart>[1]
> = {
  "1m": "dayAndMonth",
  "3m": "dayAndMonth",
  "1y": "monthAndYear",
  "5y": "monthAndYear",
};

/** Range links keep the chart usable before JavaScript loads and in browser history. */
export function StockHistoryChart({
  history,
  range,
  path,
  returnTo,
}: {
  history: StockHistory;
  range: PriceChartRange;
  path: string;
  returnTo: string | undefined;
}): ReactNode {
  const first = history.closes[0];
  const latest = history.closes.at(-1);
  return (
    <>
      <nav
        className={styles["ranges"]}
        aria-label={m.market_data_chart_range_label()}
      >
        {priceChartRangeOptions().map(({ value: choice, label }) => (
          <Link
            key={choice}
            to={`${path}?${new URLSearchParams(returnTo === undefined ? { range: choice } : { range: choice, returnTo }).toString()}`}
            aria-current={choice === range ? "true" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {first === undefined || latest === undefined ? (
        <p>{m.market_data_no_closes_notice()}</p>
      ) : (
        <>
          <h2 id="price-chart-title" className={styles["title"]}>
            {m.market_data_price_chart_title({ code: history.code })}
          </h2>
          <p>
            {m.market_data_history_period_notice({
              first: formatCalendarDate(first.date, "medium"),
              last: formatCalendarDate(latest.date, "medium"),
            })}
          </p>
          <TimeSeriesChart
            points={history.closes}
            lines={[
              {
                name: history.code,
                kind: "own",
                valueOf: (point) => point.close,
              },
            ]}
            layout={layoutTimeSeries(
              history.closes.map((point) => point.date),
              [
                {
                  kind: "own",
                  values: history.closes.map((point) => point.close),
                },
              ],
              {
                unit: splitAdjustedRupiah,
                minimum: splitAdjustedRupiah(Number.MIN_VALUE),
                smallestStep: smallestNumberStep,
                tickText: formatNumber,
                dateText: (date) =>
                  formatCalendarDatePart(date, dateParts[range]),
              },
            )}
            labelledBy="price-chart-title"
            dateLabel={m.market_data_close_date_label()}
            tableLabel={m.market_data_closes_table_label()}
            valueText={formatSplitAdjustedRupiah}
            valueNode={formatSplitAdjustedRupiah}
            area
            axisSide="right"
          />
        </>
      )}
    </>
  );
}
