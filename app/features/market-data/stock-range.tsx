import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "~/stat-grid.module.css";
import { percentOf } from "~/charts/plot";
import { fractionOf } from "~/charts/scale";
import { plotFraction } from "~/units/plot-fraction";
import rangeStyles from "./stock-range.module.css";
import { stockRangeWeeks } from "./stock-price-range";
import type { stockPriceRange } from "./stock-price-range";

export function StockRange({
  range,
}: {
  range: ReturnType<typeof stockPriceRange>;
}): ReactNode {
  const marker =
    range === undefined
      ? undefined
      : percentOf(
          plotFraction(
            range.high.close === range.low.close
              ? 0.5
              : fractionOf(
                  { min: range.low.close, max: range.high.close },
                  range.latest,
                ),
          ),
        );
  return (
    <div className={styles["stat"]}>
      <dt>
        {m.market_data_year_range_stat_label({
          weeks: formatNumber(stockRangeWeeks),
        })}
        {range !== undefined && (
          <ConceptCard
            title={m.market_data_year_range_stat_label({
              weeks: formatNumber(stockRangeWeeks),
            })}
            meaning={m.market_data_year_range_body({
              weeks: formatNumber(stockRangeWeeks),
            })}
            example={
              <p>
                {m.market_data_year_range_notice({
                  low: formatNumber(range.low.close),
                  high: formatNumber(range.high.close),
                  first: formatCalendarDate(range.first, "medium"),
                  last: formatCalendarDate(range.last, "medium"),
                })}
              </p>
            }
            calculation={
              <p>
                {m.market_data_year_range_calculation_notice({
                  low: formatNumber(range.low.close),
                  high: formatNumber(range.high.close),
                  lowDate: formatCalendarDate(range.low.date, "medium"),
                  highDate: formatCalendarDate(range.high.date, "medium"),
                })}
              </p>
            }
            lesson={<ConceptLesson termId="rentang-52-minggu" />}
          />
        )}
      </dt>
      <dd className={rangeStyles["range"]}>
        {range === undefined ? (
          <span className={styles["note"]}>
            {m.market_data_no_closes_notice()}
          </span>
        ) : (
          <>
            <svg
              className={rangeStyles["track"]}
              role="img"
              aria-label={m.market_data_price_range_part({
                low: formatNumber(range.low.close),
                high: formatNumber(range.high.close),
              })}
            >
              <line
                x1="0"
                x2="100%"
                y1="50%"
                y2="50%"
                className={rangeStyles["line"]}
              />
              <line
                x1={marker}
                x2={marker}
                y1="0"
                y2="100%"
                className={rangeStyles["mark"]}
              />
            </svg>
            <span className={rangeStyles["ends"]}>
              <span>{formatNumber(range.low.close)}</span>
              <span>{formatNumber(range.high.close)}</span>
            </span>
          </>
        )}
      </dd>
      {range !== undefined && (
        <dd className={styles["note"]}>
          {m.market_data_history_period_notice({
            first: formatCalendarDate(range.first, "medium"),
            last: formatCalendarDate(range.last, "medium"),
          })}
        </dd>
      )}
    </div>
  );
}
