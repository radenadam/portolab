import { withLessonTask } from "~/features/learning/lesson-task";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import {
  readActivityPage,
  cancelActivityOrder,
} from "./read-activity-page.server";
import { ActivitySelectionForm } from "./activity-selection-form";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { pageTitle } from "~/page-title";
import { FormFailure } from "~/form";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/activity-page";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import { ActivityOrders } from "./activity-orders";
import { JournalList } from "./journal-list";
import styles from "./activity.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.trading_activity_title()) }];
}

export function loader(args: Route.LoaderArgs) {
  return readActivityPage({ ...args, now: new Date() }, "membership");
}

export const shouldRevalidate = reloadsAfterEveryForm;

export async function action(args: Route.ActionArgs) {
  return cancelActivityOrder({ ...args, now: new Date() }, "membership");
}

export default function ActivityPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, orders, now, trades, prices } = loaderData;
  const cancelFailure = actionData?.cancelFailure;
  const { filter, view } =
    cancelFailure === undefined
      ? loaderData
      : { filter: "all" as const, view: "orders" as const };
  const base = loaderData.path;
  return (
    <div className={styles["activity"]}>
      <LessonTaskBanner classId={classId} task={loaderData.task} />
      {!loaderData.demonstration && <h1>{m.trading_activity_title()}</h1>}
      {loaderData.fields !== undefined && (
        <ActivitySelectionForm
          fields={loaderData.fields}
          task={loaderData.task}
        />
      )}
      {cancelFailure !== undefined && <FormFailure text={cancelFailure} />}
      <nav
        className={styles["toggle"]}
        aria-label={m.trading_activity_view_label()}
      >
        <Link
          to={withLessonTask(`${base}?status=${filter}`, loaderData.task)}
          aria-current={view === "orders" ? "page" : undefined}
        >
          {m.trading_activity_orders_label()}
        </Link>
        <Link
          to={withLessonTask(
            `${base}?view=journal&status=${filter}`,
            loaderData.task,
          )}
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
          task={loaderData.task}
          path={base}
          portfolioKind={loaderData.portfolioKind}
        />
        <JournalList
          trades={trades}
          prices={prices}
          classId={classId}
          task={loaderData.task}
        />
      </div>
    </div>
  );
}
