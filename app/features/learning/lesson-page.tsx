import type { ReactNode } from "react";
import { data } from "react-router";
import { pageTitle } from "~/page-title";
import { parseReturnPath } from "~/parse-return-path";
import { writeLog } from "~/write-log.server";
import type { Route } from "./+types/lesson-page";
import { isLessonKind, lessonTerms } from "./content";
import { parseSessionNumber } from "./parse-session-number";
import { LessonView } from "./lesson-view";
import { readLearningPage } from "./read-learning-page.server";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.lesson.title) }];
}

export function loader({ context, params, url }: Route.LoaderArgs) {
  const { classId, content } = readLearningPage(context, url, params.classId);
  const lessons = content.sessions.filter((entry) => isLessonKind(entry.kind));
  const session = parseSessionNumber(params.session, "session");
  if (!session.ok) throw data(null, { status: 404 });
  const index = lessons.findIndex((entry) => entry.session === session.value);
  const lesson = lessons[index];
  if (lesson === undefined) throw data(null, { status: 404 });
  const returnTo = url.searchParams.get("returnTo");
  const returnPath =
    returnTo === null
      ? undefined
      : parseReturnPath(returnTo, "returnTo", url.origin);
  if (returnPath?.ok === false) writeLog("warning", returnPath.failure);
  return {
    classId,
    lesson,
    terms: lessonTerms(lesson, content.terms),
    previous: lessons[index - 1],
    next: lessons[index + 1],
    returnTo: returnPath?.ok === true ? returnPath.value : undefined,
  };
}

export default function LessonPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <LessonView {...loaderData} />;
}
