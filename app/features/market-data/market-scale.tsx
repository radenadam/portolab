import type { ReactNode } from "react";
import { percentOf } from "~/charts/plot";
import { fractionOf } from "~/charts/scale";
import type { Range } from "~/charts/scale";
import type { ChangeDirection } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import styles from "./market-view.module.css";

const directions: Record<ChangeDirection, string | undefined> = {
  rise: styles["gainBar"],
  fall: styles["lossBar"],
  none: styles["flatBar"],
};

/** A shared scale lets a reader compare rows without opening their stocks. */
export function MarketScale({
  value,
  range,
  reference,
  direction,
}: {
  value: number;
  range: Range<number>;
  reference?: number | undefined;
  direction?: ChangeDirection;
}): ReactNode {
  const position = (number: number): string =>
    percentOf(plotFraction(fractionOf(range, number)));
  return (
    <span className={styles["scale"]} aria-hidden>
      {direction === undefined ? (
        <i className={styles["scaleDot"]} style={{ left: position(value) }} />
      ) : (
        <i
          className={directions[direction]}
          style={{
            left: position(Math.min(0, value)),
            width: percentOf(
              plotFraction(Math.abs(value) / (range.max - range.min)),
            ),
          }}
        />
      )}
      {reference !== undefined && (
        <i
          data-market-reference=""
          className={styles["referenceTick"]}
          style={{ left: position(reference) }}
        />
      )}
    </span>
  );
}
