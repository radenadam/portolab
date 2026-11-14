import type { ReactNode } from "react";
import type { ChangeDirection, SignedChange } from "./formatting";
import styles from "./change-text.module.css";

const arrows: Record<ChangeDirection, string | undefined> = {
  rise: "▲",
  fall: "▼",
  none: undefined,
};

/** A formatted change with its arrow. A rebuilt screen uses the gain and loss colors, while a screen still on Tenang keeps its ink. */
export function ChangeText({
  change,
  colored = false,
}: {
  change: SignedChange;
  colored?: boolean;
}): ReactNode {
  const arrow = arrows[change.direction];
  const content = (
    <>
      {/* The arrow repeats the sign that the change shows for sighted readers, so screen readers skip it. The space belongs to the arrow, so a change without an arrow starts with its number. */}
      {arrow !== undefined && <span aria-hidden="true">{`${arrow} `}</span>}
      {change.text}
    </>
  );
  return colored ? (
    <span className={styles["colored"]} data-change={change.direction}>
      {content}
    </span>
  ) : (
    content
  );
}
