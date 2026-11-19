import type { ReactNode, ComponentProps } from "react";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import { FormFailure } from "~/form";
import { m } from "~/paraglide/messages.js";
import { ActivitySelectionForm } from "./activity-selection-form";
import type { ActivitySelectionFields } from "./activity-selection-form";
import { ActivityOrders } from "./activity-orders";
import styles from "./activity.module.css";

export function ActivityView({
  classId,
  task,
  orders,
  now,
  trades,
  prices,
  fields,
  filter,
  base,
  readOnly = false,
  cancelFailure,
  studentName,
  returnPath,
  portfolioKind,
  showTitle = !readOnly,
}: ComponentProps<typeof ActivityOrders> & {
  fields: ActivitySelectionFields | undefined;
  base: string;
  readOnly?: boolean;
  cancelFailure?: string | undefined;
  returnPath?: string | undefined;
  showTitle?: boolean;
}): ReactNode {
  return (
    <div className={styles["activity"]}>
      <LessonTaskBanner classId={classId} task={task} />
      {showTitle && <h1>{m.trading_activity_title()}</h1>}
      {fields !== undefined && (
        <ActivitySelectionForm
          fields={fields}
          returnPath={returnPath}
          task={task}
        />
      )}
      {cancelFailure !== undefined && <FormFailure text={cancelFailure} />}
      <div className={styles["columns"]}>
        <ActivityOrders
          trades={trades}
          prices={prices}
          orders={orders}
          task={task}
          now={now}
          classId={classId}
          filter={filter}
          readOnly={readOnly}
          studentName={studentName}
          portfolioKind={portfolioKind}
          basePath={base}
        />
      </div>
    </div>
  );
}
