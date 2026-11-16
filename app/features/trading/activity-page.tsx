import {
  readActivityPage,
  cancelActivityOrder,
} from "./read-activity-page.server";
import { ActivityView } from "./activity-view";
import type { ReactNode } from "react";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/activity-page";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";

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
  const cancelFailure = actionData?.cancelFailure;
  const { filter, view } =
    cancelFailure === undefined
      ? loaderData
      : { filter: "all" as const, view: "orders" as const };
  return (
    <ActivityView
      {...loaderData}
      base={loaderData.path}
      showTitle={!loaderData.demonstration}
      filter={filter}
      view={view}
      cancelFailure={cancelFailure}
    />
  );
}
