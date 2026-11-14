import type { ReactNode } from "react";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { listReaderClasses } from "~/features/classes/class-store.server";
import { classCalendarOf } from "~/features/classes/course-calendar";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/learn-page";
import { LearningIndex } from "./learning-index";
import { readLearningPage } from "./read-learning-page.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.learning_title()) }];
}

export function loader({ context, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const { classId, content } = readLearningPage(context, url, params.classId);
  const reader = requireUser(context, url);
  const readerClass = listReaderClasses(
    context.get(databaseContext),
    reader,
  ).classes.find((entry) => entry.id === classId);
  if (readerClass === undefined) throw data(null, { status: 404 });
  return {
    classId,
    sessions: content.sessions,
    calendar: classCalendarOf(readerClass.firstSessionDate, now),
  };
}

export default function LearnPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <LearningIndex {...loaderData} />;
}
