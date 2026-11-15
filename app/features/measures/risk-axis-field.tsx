import type { ReactNode } from "react";
import { TextField } from "~/form";
import styles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import { analysisAxes } from "./analysis-axes";
import { analysisAxisDetails } from "./analysis-axis-details";

export function RiskAxisField({
  name,
  label,
  value,
  failure,
}: {
  name: string;
  label: string;
  value: string;
  failure: string | undefined;
}): ReactNode {
  return (
    <div className={styles["field"]}>
      <TextField
        name={name}
        label={label}
        type="text"
        autoComplete="off"
        defaultValue={value}
        failure={failure}
      />
      <ul>
        {analysisAxes.map((axis) => (
          <li key={axis}>
            {m.measures_analysis_axis_hint({
              axis: analysisAxisDetails(axis).label,
              value: axis,
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}
