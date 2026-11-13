import type { ReactNode } from "react";
import legendStyles from "~/chart-legend.module.css";
import type { MarkKind } from "./map-drawing";
import styles from "./risk-map.module.css";

/** What a key of the legend of a map shows: a mark, or a piece of the line. */
type MapKeyKind = MarkKind | "line";

const keyClasses: Record<MapKeyKind, string | undefined> = {
  own: styles["ownKey"],
  held: styles["heldKey"],
  other: styles["otherKey"],
  market: styles["marketKey"],
  line: styles["lineKey"],
};

/** The legend of a map, which names each kind of point and the line beside a sample of its mark. Screen readers skip it, as they skip the drawing, because the slider and the table of the points name every point. */
export function RiskMapLegend({
  items,
}: {
  items: readonly { kind: MapKeyKind; name: string }[];
}): ReactNode {
  return (
    <ul className={legendStyles["legend"]} aria-hidden>
      {items.map(({ kind, name }) => (
        <li key={kind} className={styles["legendItem"]}>
          <span className={keyClasses[kind]} />
          {name}
        </li>
      ))}
    </ul>
  );
}
