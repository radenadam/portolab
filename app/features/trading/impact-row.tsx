import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import styles from "./impact-row.module.css";

export function ImpactRow<Quantity extends number>({
  name,
  label,
  before,
  after,
  format,
}: {
  name: string;
  label?: ReactNode;
  before: Quantity;
  after: Quantity;
  format: (value: Quantity) => string;
}): ReactNode {
  const first = format(before);
  const second = format(after);
  return (
    <div className={styles["row"]}>
      <span className={styles["rowLabel"]}>
        {label ?? <span aria-hidden>{name}</span>}
      </span>
      <span className={styles["from"]} aria-hidden>
        <NumberText whole>{first}</NumberText>
      </span>
      <span className={styles["arrow"]} aria-hidden>
        →
      </span>
      <strong aria-hidden>
        <NumberText whole>
          {second}
          {first !== second && (
            <span className={styles["direction"]} aria-hidden>
              {after > before ? "▲" : "▼"}
            </span>
          )}
        </NumberText>
      </strong>
      <span className={styles["srOnly"]}>
        {m.trading_impact_change_notice({
          label: name,
          before: first,
          after: second,
        })}
      </span>
    </div>
  );
}
