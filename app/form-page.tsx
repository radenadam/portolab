import type { ReactNode } from "react";
import styles from "./page-layout.module.css";

/** Decision 0028 uses ticket panels when no reference draws a form page, so these pages share one composition. */
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
