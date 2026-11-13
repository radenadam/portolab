import type { ReactNode } from "react";
import type { LineKind } from "./time-chart-layout";
import styles from "./time-chart.module.css";

const keyClasses: Record<LineKind, string | undefined> = {
  own: styles["ownKey"],
  reference: styles["referenceKey"],
};

/** A short piece of a line of a chart in its color, which names the line in a legend or a tooltip beside its name. */
export function LineKey({ kind }: { kind: LineKind }): ReactNode {
  return <span className={keyClasses[kind]} aria-hidden />;
}
