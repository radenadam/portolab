import type { LessonTask } from "~/features/learning/lesson-task";
import { lessonTaskField } from "~/features/learning/lesson-task";
import type { ReactNode } from "react";
import { Form } from "react-router";
import type { FieldOption } from "~/form";
import { SelectField } from "~/form";
import { m } from "~/paraglide/messages.js";
import { activityFilterOptions } from "./activity-options";
import styles from "./activity.module.css";

export interface ActivitySelectionFields {
  status: string;
  statusFailure: string;
}

export function ActivitySelectionForm({
  fields,
  task,
  returnPath,
}: {
  fields: ActivitySelectionFields;
  task?: LessonTask | undefined;
  returnPath?: string | undefined;
}): ReactNode {
  const statusOptions: FieldOption[] = [
    { value: fields.status, label: fields.status },
    ...activityFilterOptions(),
  ];
  return (
    <Form method="get" className={styles["selectionForm"]}>
      {task !== undefined && (
        <input type="hidden" name={lessonTaskField} value={String(task)} />
      )}
      {returnPath !== undefined && (
        <input type="hidden" name="returnTo" value={returnPath} />
      )}
      <SelectField
        name="status"
        label={m.trading_activity_status_label()}
        placeholder={m.trading_activity_choose_status_label()}
        options={statusOptions}
        defaultValue={fields.status}
        failure={fields.statusFailure}
      />
      <button className={styles["button"]} type="submit">
        {m.trading_activity_apply_label()}
      </button>
    </Form>
  );
}
