import type { ReactNode } from "react";
import { BackLink } from "./back-link";
import { NumberText } from "./number-text";
import styles from "./form.module.css";

/** Decision 0028 uses ticket panels when no reference draws a form page, so these pages share one composition: a card in the middle of the page, with the way back above it when the page has one. */
export function FormPage({
  title,
  back,
  children,
}: {
  title: ReactNode;
  /** The place that the reader came from, which the page links back to at its top. */
  back?: { to: string; label: string } | undefined;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["formPage"]} data-layout="reading">
      {back !== undefined && <BackLink to={back.to} label={back.label} />}
      <div className={styles["formCard"]}>
        <h1>
          {typeof title === "string" ? <NumberText>{title}</NumberText> : title}
        </h1>
        {children}
      </div>
    </div>
  );
}
