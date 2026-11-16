import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import { RiskAxisField } from "./risk-axis-field";
import styles from "./analysis.module.css";

export function AnalysisAxisForm({
  returnPath,
  value,
  failure,
  path = ".",
  showTitle = true,
}: {
  returnPath?: string;
  value: string;
  failure: string;
  path?: string;
  showTitle?: boolean;
}): ReactNode {
  return (
    <div className={styles["page"]}>
      {showTitle &&
        (returnPath === undefined ? (
          <h1>{m.measures_analysis_title()}</h1>
        ) : (
          <h2>{m.measures_analysis_title()}</h2>
        ))}
      <Form method="get" action={path} className={formStyles["form"]}>
        {returnPath !== undefined && (
          <input type="hidden" name="returnTo" value={returnPath} />
        )}
        <RiskAxisField
          name="axis"
          label={m.measures_analysis_axis_label()}
          value={value}
          failure={failure}
        />
        <SubmitButton label={m.measures_analysis_apply_label()} />
      </Form>
    </div>
  );
}
