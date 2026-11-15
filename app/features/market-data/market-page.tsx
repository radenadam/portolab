import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import type { Route } from "./+types/market-page";
import { readPrices } from "./read-prices.server";
import { readLessonTask } from "~/features/learning/read-lesson-task.server";
import { LessonTaskBanner } from "~/features/learning/lesson-task-banner";
import { PricesView } from "./prices-view";

// The market of a class shows the table of the prices until the change of issue #127 that rebuilds Pasar.
export { meta } from "./prices-page";

/** The prices for the lecturer and the students of a class. Every other reader gets the page of an address that does not exist. */
export function loader({ context, params, url }: Route.LoaderArgs) {
  const classId = requireReaderClass(context, url, params.classId);
  const task = readLessonTask(url);
  return {
    ...readPrices(context, new Date()),
    classId,
    task,
  };
}

export default function MarketPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <LessonTaskBanner classId={loaderData.classId} task={loaderData.task} />
      <PricesView {...loaderData} />
    </>
  );
}
