import type { ReactNode } from "react";
import { Link } from "react-router";
import { directionOf } from "~/charts/direction-of";
import { layoutTimeSeries } from "~/charts/time-chart-layout";
import { TimeSeriesChart } from "~/charts/time-chart";
import {
  formatNumber,
  smallestNumberStep,
  formatCalendarDatePart,
  formatSplitAdjustedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { StockHistory } from "./price-source.server";
import { priceChartRangeOptions } from "./price-chart-range";
import type { PriceChartRange } from "./price-chart-range";
import styles from "./stock-history-chart.module.css";
import { pathWithQuery } from "~/path-with-query";

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
  const kind =
    first === undefined || latest === undefined
      ? "none"
      : directionOf(first.close, latest.close);
  // A range without closes keeps the choice of the other ranges, which can hold older closes.
  return (
    <>
      <div className={styles["head"]}>
        <h2 id="price-chart-title" className={styles["title"]}>
          {m.market_data_price_chart_title({ code: history.code })}
        </h2>
        <nav
          className={styles["ranges"]}
          aria-label={m.market_data_chart_range_label()}
        >
          {priceChartRangeOptions().map(({ value: choice, label }) => (
            <Link
              key={choice}
              to={pathWithQuery(path, { range: choice, returnTo })}
              preventScrollReset
              aria-current={choice === range ? "true" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {first === undefined || latest === undefined ? (
        <p>{m.market_data_no_closes_notice()}</p>
      ) : (
        <TimeSeriesChart
          points={history.closes}
          lines={[
            {
              name: history.code,
              kind,
              valueOf: (point) => point.close,
            },
          ]}
          layout={layoutTimeSeries(
            history.closes.map((point) => point.date),
            [
              {
                kind,
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
      )}
    </>
  );
}
