import type { LessonTask } from "~/features/learning/lesson-task";
import type { ReactNode } from "react";
import { Form } from "react-router";
import type { FieldOption } from "~/form";
import { SelectField } from "~/form";
import { m } from "~/paraglide/messages.js";
import { activityFilterOptions, activityViewOptions } from "./activity-options";
import styles from "./activity.module.css";

export interface ActivitySelectionFields {
  status: string;
  view: string;
  statusFailure: string | undefined;
  viewFailure: string | undefined;
}

export function ActivitySelectionForm({
  fields,
  task,
}: {
  fields: ActivitySelectionFields;
  task?: LessonTask | undefined;
}): ReactNode {
  const statusOptions: FieldOption[] = activityFilterOptions();
  const viewOptions: FieldOption[] = activityViewOptions();
  if (fields.statusFailure !== undefined)
    statusOptions.unshift({ value: fields.status, label: fields.status });
  if (fields.viewFailure !== undefined)
    viewOptions.unshift({ value: fields.view, label: fields.view });
  return (
    <Form method="get" className={styles["selectionForm"]}>
      {task !== undefined && (
        <input type="hidden" name="lessonTask" value={String(task)} />
      )}
      <SelectField
        name="status"
        label={m.trading_activity_status_label()}
        placeholder={m.trading_activity_choose_status_label()}
        options={statusOptions}
        defaultValue={fields.status}
        failure={fields.statusFailure}
      />
      <SelectField
        name="view"
        label={m.trading_activity_view_label()}
        placeholder={m.trading_activity_choose_view_label()}
        options={viewOptions}
        defaultValue={fields.view}
        failure={fields.viewFailure}
      />
      <button className={styles["button"]} type="submit">
        {m.trading_activity_apply_label()}
      </button>
    </Form>
  );
}
