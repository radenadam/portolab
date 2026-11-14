import type { ReactNode } from "react";
import styles from "./page-layout.module.css";

/** Outside a class, a single form takes the panel of a docked ticket in a centered column, as decision 0028 sets. */
export function FormPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["formPage"]} data-layout="reading">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
