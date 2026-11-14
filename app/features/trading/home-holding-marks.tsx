import type { ReactNode } from "react";
import { percentOf } from "~/charts/plot";
import { formatPercent, formatSignedRupiah } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import styles from "./home-portfolio.module.css";

export function WeightMark({
  value,
  maximum,
}: {
  value: PortfolioWeight | undefined;
  maximum: PortfolioWeight;
}): ReactNode {
  return value === undefined ? null : (
    <div className={styles["weight"]}>
      <span>{formatPercent(value, "two")}</span>
      <span className={styles["weightTrack"]} aria-hidden="true">
        <span style={{ width: percentOf(plotFraction(value / maximum)) }} />
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
