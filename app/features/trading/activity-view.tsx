import type { ReactNode, ComponentProps } from "react";
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
}: ComponentProps<typeof ActivityOrders> &
  ComponentProps<typeof JournalList> & {
    fields: ActivitySelectionFields | undefined;
    view: ActivityChoice;
    base: string;
    readOnly?: boolean;
    cancelFailure?: string | undefined;
    returnPath?: string | undefined;
  }): ReactNode {
  const separator = base.includes("?") ? "&" : "?";

  return (
    <div className={styles["activity"]} data-read-only={readOnly || undefined}>
      {!readOnly && <h1>{m.trading_activity_title()}</h1>}
      {fields !== undefined && (
        <ActivitySelectionForm fields={fields} returnPath={returnPath} />
      )}
      {cancelFailure !== undefined && <FormFailure text={cancelFailure} />}
      <nav
        className={styles["toggle"]}
        aria-label={m.trading_activity_view_label()}
      >
        <Link
          to={`${base}${separator}view=orders&status=${filter}`}
          aria-current={view === "orders" ? "page" : undefined}
        >
          {m.trading_activity_orders_label()}
        </Link>
        <Link
          to={`${base}${separator}view=journal&status=${filter}`}
          aria-current={view === "journal" ? "page" : undefined}
        >
          {m.trading_activity_journal_label()}
        </Link>
      </nav>
      <div className={styles["columns"]} data-layout="columns" data-view={view}>
        <ActivityOrders
          orders={orders}
          now={now}
          classId={classId}
          filter={filter}
          readOnly={readOnly}
          studentName={studentName}
          basePath={readOnly ? `${base}${separator}view=orders` : base}
        />
        <JournalList trades={trades} prices={prices} classId={classId} />
      </div>
    </div>
  );
}
