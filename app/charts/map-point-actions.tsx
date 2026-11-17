import type { CSSProperties, ReactNode, MouseEventHandler } from "react";
import { Link } from "react-router";
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
  onActivate: MouseEventHandler<HTMLElement>;
}): ReactNode {
  const actions: ReactNode[] = [];
  for (const { point, placed: mark } of drawn) {
    if (point.popover === undefined && point.href === undefined) continue;
    actions.push(
      <span
        key={point.key}
        className={styles["pointAction"]}
        style={{
          left: percentOf(mark.position.x),
          top: percentOf(mark.position.y),
        }}
      >
        {point.href !== undefined ? (
          <Link
            to={point.href}
            className={styles["pointButton"]}
            aria-label={point.name}
            onClick={onActivate}
          >
            <span className={styles["pointFocus"]} />
          </Link>
        ) : point.popover !== undefined ? (
          <PopoverButton
            popover={point.popover}
            onClick={onActivate}
            label={m.app_map_calculation_label({ name: point.name })}
            className={styles["pointButton"]}
          >
            <span className={styles["pointFocus"]} />
          </PopoverButton>
        ) : null}
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
