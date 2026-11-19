import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import styles from "./home-portfolio.module.css";

/** Cash has no logo, so its row keeps the room of a logo empty, which lines its name up with the codes of the stocks above it. */
export function CashName({ note }: { note: string }): ReactNode {
  return (
    <div className={styles["cashName"]}>
      <span className={styles["cashTile"]} aria-hidden="true" />
      <span>
        {m.trading_cash_label()}
        <small>
          <NumberText>{note}</NumberText>
        </small>
      </span>
    </div>
  );
}
