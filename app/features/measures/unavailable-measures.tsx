import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import styles from "./analysis-extras.module.css";

export function UnavailableMeasures(): ReactNode {
  return (
    <a className={styles["unavailable"]} href="#analysis-measures-title">
      {m.measures_analysis_unavailable_link()}
    </a>
  );
}
