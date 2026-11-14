import type { ReactNode } from "react";
import { formatRupiahParts } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Rupiah } from "~/units/rupiah";
import styles from "./home-portfolio.module.css";

export function CashName({
  note,
  cash,
}: {
  note: string;
  cash: Rupiah;
}): ReactNode {
  return (
    <div className={styles["cashName"]}>
      <span className={styles["cashTile"]} aria-hidden="true">
        {formatRupiahParts(cash)
          .filter((part) => part.type === "currency")
          .map((part) => part.value)
          .join("")}
      </span>
      <span>
        {m.trading_cash_label()}
        <small>{note}</small>
      </span>
    </div>
  );
}
