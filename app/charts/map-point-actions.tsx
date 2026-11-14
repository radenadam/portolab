import type { CSSProperties, ReactNode, MouseEventHandler } from "react";
import { PopoverButton } from "~/popover";
import { m } from "~/paraglide/messages.js";
import { percentOf } from "./plot";
import type { DrawnPoint } from "./map-drawing";
import styles from "./risk-map.module.css";

export function MapPointActions({
  drawn,
  style,
  onActivate,
}: {
  drawn: readonly DrawnPoint[];
  style: CSSProperties;
  onActivate: MouseEventHandler<HTMLButtonElement>;
}): ReactNode {
  const actions: ReactNode[] = [];
  for (const { point, placed: mark } of drawn) {
    if (point.popover === undefined) continue;
    actions.push(
      <span
        key={point.key}
        className={styles["pointAction"]}
        style={{
          left: percentOf(mark.position.x),
          top: percentOf(mark.position.y),
        }}
      >
        <PopoverButton
          popover={point.popover}
          onClick={onActivate}
          label={m.app_map_calculation_label({ name: point.name })}
          className={styles["pointButton"]}
        >
          <span className={styles["pointFocus"]} />
        </PopoverButton>
      </span>,
    );
  }
  if (actions.length === 0) return null;
  return (
    <div className={styles["actionLayer"]} style={style}>
      <div className={styles["actionArea"]}>{actions}</div>
    </div>
  );
}
