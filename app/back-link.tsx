import type { ReactNode } from "react";
import { Link } from "react-router";
import { NumberText } from "./number-text";
import styles from "./back-link.module.css";

/** The way back from a screen to the place that the reader came from, at the top of the screen, such as from the page of a stock to Pasar or from the schedule of a class to the class. */
export function BackLink({
  to,
  label,
}: {
  to: string;
  label: string;
}): ReactNode {
  return (
    <Link to={to} className={styles["back"]}>
      ‹ <NumberText verbatim>{label}</NumberText>
    </Link>
  );
}
