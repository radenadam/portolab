import {
  cancelActivityOrder,
  readActivityPage,
} from "./read-activity-page.server";
import type { Route } from "./+types/demonstration-activity-page";

export { default, shouldRevalidate } from "./activity-page";

export function loader(args: Route.LoaderArgs) {
  return readActivityPage({ ...args, now: new Date() }, "demonstration");
}

export function action(args: Route.ActionArgs) {
  return cancelActivityOrder({ ...args, now: new Date() }, "demonstration");
}
