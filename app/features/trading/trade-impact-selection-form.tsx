import type { ReactNode } from "react";
import { Form } from "react-router";
import { SelectField, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { RiskAxisField } from "~/features/measures/risk-axis-field";
import { m } from "~/paraglide/messages.js";
import type { readImpactSelection } from "./read-impact-selection.server";
import { impactShareOptions } from "./impact-shares";
import styles from "./trade-impact.module.css";

export function TradeImpactSelectionForm({
  fields,
}: {
  fields: NonNullable<ReturnType<typeof readImpactSelection>["fields"]>;
}): ReactNode {
  const options = impactShareOptions();
  if (fields.shareFailure !== undefined)
    options.unshift({ value: fields.share, label: fields.share });
  return (
    <section className={styles["panel"]} data-layout="card">
      <h1>{m.trading_impact_title()}</h1>
      <Form method="get" action={fields.path} className={formStyles["form"]}>
        {fields.kept.map(([name, value], index) => (
          <input
            key={`${name}:${String(index)}`}
            type="hidden"
            name={name}
            value={value}
          />
        ))}
        <SelectField
          name="impact"
          label={m.trading_impact_share_label()}
          options={options}
          defaultValue={fields.share}
          failure={fields.shareFailure}
        />
        <RiskAxisField
          name="impactAxis"
          label={m.trading_impact_axis_label()}
          value={fields.axis}
          failure={fields.axisFailure}
        />
        <SubmitButton label={m.trading_impact_apply_label()} />
      </Form>
    </section>
  );
}
