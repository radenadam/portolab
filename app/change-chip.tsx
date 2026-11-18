import type { ReactNode } from "react";
import { ChangeText } from "./change-text";
import styles from "./change-chip.module.css";
import type { SignedChange } from "./formatting";

/** A change in a chip tinted by the direction that its sign shows, such as the change of a price today beside the price, as the references of decision 0028 draw it on Beranda, on a stock, and on the IHSG of Pasar. */
export function ChangeChip({ change }: { change: SignedChange }): ReactNode {
  return (
    <span className={styles["chip"]} data-change={change.direction}>
      <ChangeText colored change={change} />
    </span>
  );
}
