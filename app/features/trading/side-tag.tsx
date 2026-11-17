import type { ReactNode } from "react";
import type { OrderSide } from "./order";
import { orderSideLabel } from "./order-form-fields";
import styles from "./side-tag.module.css";

/** The side of an order in the color of Beli or Jual, as decision 0028 sets wherever a trade starts or is confirmed. */
export function SideTag({ side }: { side: OrderSide }): ReactNode {
  return (
    <span className={styles["side"]} data-side={side}>
      {orderSideLabel(side)}
    </span>
  );
}
