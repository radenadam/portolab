import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import { analysisAxes } from "./analysis-axes";
import { analysisAxisDetails } from "./analysis-axis-details";
import styles from "./analysis.module.css";

export function AnalysisAxisForm({
  returnPath,
  value,
  failure,
}: {
  returnPath?: string;
  value: string;
  failure: string;
}): ReactNode {
  return (
    <div className={styles["page"]}>
      {returnPath === undefined ? (
        <h1>{m.measures_analysis_title()}</h1>
      ) : (
        <h2>{m.measures_analysis_title()}</h2>
      )}
      <Form method="get" className={formStyles["form"]}>
        {returnPath !== undefined && (
          <input type="hidden" name="returnTo" value={returnPath} />
        )}
        <TextField
          name="axis"
          label={m.measures_analysis_axis_label()}
          type="text"
          autoComplete="off"
          defaultValue={value}
          failure={failure}
        />
        <SubmitButton label={m.measures_analysis_apply_label()} />
      </Form>
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
