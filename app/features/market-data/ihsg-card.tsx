import { IndexHelp } from "./index-help";
import { QuoteTime } from "./quote-time";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { TimeSeriesChart } from "~/charts/time-chart";
import { layoutTimeSeries } from "~/charts/time-chart-layout";
import type { LineKind } from "~/charts/time-chart-layout";
import { ChangeText } from "~/change-text";
import {
  formatIndexLevel,
  formatSignedPercent,
  smallestIndexLevelStep,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { indexPoints } from "~/units/index-points";
import type { IndexPoints } from "~/units/index-points";
import type { MarketFilters } from "./market-filters";
import { marketRangeOptions } from "./market-filters";
import { marketSearch } from "./market-search";
import type { DailyClose, IndexQuote, IndexCode } from "./price-source.server";
import { quoteChange } from "./quote-change";
import styles from "./market-view.module.css";

/** A range keeps the GET filters so returning from a stock restores the same list. */
export function IhsgCard({
  index,
  quote,
  closes,
  filters,
  missed,
}: {
  index: IndexCode;
  quote: IndexQuote | undefined;
  closes: readonly DailyClose<IndexPoints>[];
  filters: MarketFilters;
  missed: boolean;
}): ReactNode {
  const first = closes[0];
  const last = closes.at(-1);
  const kind: LineKind =
    first === undefined || last === undefined || first.close === last.close
      ? "flat"
      : last.close > first.close
        ? "rise"
        : "fall";
  return (
    <section
      className={styles["panel"]}
      aria-labelledby="ihsg-heading"
      data-layout="panel"
    >
      <div className={styles["cardHeader"]}>
        <div className={styles["headingGroup"]}>
          <h2 id="ihsg-heading">{index}</h2>
          <IndexHelp index={index} quote={quote} missed={missed} />
        </div>
        <nav
          aria-label={m.market_data_range_label({ index })}
          className={styles["ranges"]}
        >
          {marketRangeOptions().map(({ value: range, label }) => (
            <Link
              key={range}
              to={marketSearch({ ...filters, range })}
              aria-current={filters.range === range ? "true" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {quote === undefined ? (
        <p>{m.market_data_no_price_notice({ code: index })}</p>
      ) : (
        <div className={styles["indexPrice"]}>
          <strong>{formatIndexLevel(quote.level)}</strong>
          <ChangeText
            colored
            change={formatSignedPercent(quoteChange(quote))}
          />
          <QuoteTime quotedAt={quote.quotedAt} />
          {missed && (
            <span className={styles["missed"]}>
              {m.market_data_missed_label()}
            </span>
          )}
        </div>
      )}
      {closes.length === 0 ? (
        <p>{m.market_data_no_chart_notice()}</p>
      ) : (
        <div className={styles["indexChart"]}>
          <TimeSeriesChart
            points={closes}
            lines={[
              {
                name: index,
                kind,
                valueOf: (point) => point.close,
              },
            ]}
            layout={layoutTimeSeries(
              closes.map((point) => point.date),
              [{ kind, values: closes.map((point) => point.close) }],
              {
                unit: indexPoints,
                minimum: indexPoints(Number.MIN_VALUE),
                smallestStep: smallestIndexLevelStep,
                tickText: formatIndexLevel,
              },
            )}
            valueText={formatIndexLevel}
            valueNode={formatIndexLevel}
            area
            axisSide="right"
            legend={false}
            labelledBy="ihsg-heading"
            dateLabel={m.market_data_date_label()}
            tableLabel={m.market_data_index_table_label({ index })}
          />
        </div>
      )}
    </section>
  );
}
