import type { ReactNode } from "react";
import { Form } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import { RiskAxisField } from "./risk-axis-field";
import { measuresPath } from "./measures-path";
import styles from "./analysis.module.css";

export function AnalysisAxisForm({
  classId,
  value,
  failure,
}: {
  classId: ClassId;
  value: string;
  failure: string;
}): ReactNode {
  return (
    <div className={styles["page"]}>
      <h1>{m.measures_analysis_title()}</h1>
      <Form
        method="get"
        action={measuresPath(classId)}
        className={formStyles["form"]}
      >
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
