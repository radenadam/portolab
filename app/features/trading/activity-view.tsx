import type { ReactNode, ComponentProps } from "react";
import { withLessonTask } from "~/features/learning/lesson-task";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import { Link } from "react-router";
import { FormFailure } from "~/form";
import { m } from "~/paraglide/messages.js";
import { ActivitySelectionForm } from "./activity-selection-form";
import type { ActivitySelectionFields } from "./activity-selection-form";
import { ActivityOrders } from "./activity-orders";
import { JournalList } from "./journal-list";
import type { ActivityView as ActivityChoice } from "./activity-selection";
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
  view,
  base,
  readOnly = false,
  cancelFailure,
  studentName,
  returnPath,
  portfolioKind,
  showTitle = !readOnly,
}: ComponentProps<typeof ActivityOrders> &
  Omit<ComponentProps<typeof JournalList>, "readOnly"> & {
    fields: ActivitySelectionFields | undefined;
    view: ActivityChoice;
    base: string;
    readOnly?: boolean;
    cancelFailure?: string | undefined;
    returnPath?: string | undefined;
    showTitle?: boolean;
  }): ReactNode {
  const separator = base.includes("?") ? "&" : "?";

  return (
    <div className={styles["activity"]} data-read-only={readOnly || undefined}>
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
      <nav
        className={styles["toggle"]}
        aria-label={m.trading_activity_view_label()}
      >
        <Link
          to={withLessonTask(
            `${base}${separator}view=orders&status=${filter}`,
            task,
          )}
          aria-current={view === "orders" ? "page" : undefined}
        >
          {m.trading_activity_orders_label()}
        </Link>
        <Link
          to={withLessonTask(
            `${base}${separator}view=journal&status=${filter}`,
            task,
          )}
          aria-current={view === "journal" ? "page" : undefined}
        >
          {m.trading_activity_journal_label()}
        </Link>
      </nav>
      <div className={styles["columns"]} data-layout="columns" data-view={view}>
        <ActivityOrders
          orders={orders}
          task={task}
          now={now}
          classId={classId}
          filter={filter}
          readOnly={readOnly}
          studentName={studentName}
          portfolioKind={portfolioKind}
          basePath={readOnly ? `${base}${separator}view=orders` : base}
        />
        <JournalList
          trades={trades}
          task={task}
          prices={prices}
          classId={classId}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
