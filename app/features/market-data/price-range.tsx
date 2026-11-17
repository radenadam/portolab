import type { ReactNode } from "react";
import { percentOf } from "~/charts/plot";
import { fractionOf } from "~/charts/scale";
import { formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { plotFraction } from "~/units/plot-fraction";
import styles from "./stock-range.module.css";

export function PriceRange<Price extends number>({
  low,
  high,
  latest,
}: {
  low: Price;
  high: Price;
  latest: Price;
}): ReactNode {
  const marker = percentOf(
    plotFraction(
      high === low ? 0.5 : fractionOf({ min: low, max: high }, latest),
    ),
  );
  return (
    <>
      <svg
        className={styles["track"]}
        role="img"
        aria-label={m.market_data_price_range_part({
          low: formatNumber(low),
          high: formatNumber(high),
        })}
      >
        <line x1="0" x2="100%" y1="50%" y2="50%" className={styles["line"]} />
        <line
          x1={marker}
          x2={marker}
          y1="0"
          y2="100%"
          className={styles["mark"]}
        />
      </svg>
      <span className={styles["ends"]}>
        <span>
          <NumberText>{formatNumber(low)}</NumberText>
        </span>
        <span>
          <NumberText>{formatNumber(high)}</NumberText>
        </span>
      </span>
    </>
  );
}
