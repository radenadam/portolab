import type { ReactNode } from "react";
import { NumberText } from "./number-text";
import styles from "./form.module.css";

/** Decision 0028 uses ticket panels when no reference draws a form page, so these pages share one composition. */
export function FormPage({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["formPage"]} data-layout="reading">
      <h1>
        {typeof title === "string" ? <NumberText>{title}</NumberText> : title}
      </h1>
      {children}
    </div>
  );
}
