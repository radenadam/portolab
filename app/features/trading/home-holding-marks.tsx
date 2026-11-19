import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { percentOf } from "~/charts/plot";
import { formatPercent, formatSignedRupiah } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import styles from "./home-portfolio.module.css";

const weightFills = {
  stock: "stockWeight",
  cash: "cashWeight",
} as const;

/** A weight fills its share of the whole track, so the weights of a portfolio and its cash add up to one full track. Cash fills from the other end, because it is the part of the portfolio that is not invested. */
export function WeightMark({
  value,
  kind,
}: {
  value: PortfolioWeight | undefined;
  kind: keyof typeof weightFills;
}): ReactNode {
  return value === undefined ? null : (
    <div className={styles["weight"]}>
      <span>
        <NumberText>{formatPercent(value, "two")}</NumberText>
      </span>
      <span className={styles["weightTrack"]} aria-hidden="true">
        <span
          className={styles[weightFills[kind]]}
          style={{ width: percentOf(plotFraction(value)) }}
        />
      </span>
    </div>
  );
}

export function GainMark({
  value,
  maximum,
}: {
  value: Rupiah;
  maximum: Rupiah;
}): ReactNode {
  const direction = formatSignedRupiah(value).direction;
  const start = value < 0 ? 0.5 - Math.abs(value) / maximum / 2 : 0.5;
  return (
    <span className={styles["gainTrack"]} aria-hidden="true">
      <span
        className={styles[direction]}
        style={{
          left: percentOf(plotFraction(start)),
          width: percentOf(plotFraction(Math.abs(value) / maximum / 2)),
        }}
      />
    </span>
  );
}
