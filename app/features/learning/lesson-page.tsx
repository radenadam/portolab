import type { ReactNode } from "react";
import { data } from "react-router";
import { pageTitle } from "~/page-title";
import { readLearningReturnPath } from "./read-learning-return-path.server";
import type { Route } from "./+types/lesson-page";
import { isLessonKind, lessonTerms } from "./content";
import { parseSessionNumber } from "./parse-session-number";
import { LessonView } from "./lesson-view";
import { readLearningPage } from "./read-learning-page.server";
import { readLessonPractice } from "./read-lesson-practice.server";
import { lessonActivityOf } from "./lesson-practice-sessions";
import { readLearningTrade } from "~/features/trading/read-learning-trade.server";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.lesson.title) }];
}

export function loader({ context, params, url, request }: Route.LoaderArgs) {
  const { classId, content } = readLearningPage(context, url, params.classId);
  const lessons = content.sessions.filter((entry) => isLessonKind(entry.kind));
  const session = parseSessionNumber(params.session, "session");
  if (!session.ok) throw data(null, { status: 404 });
  const index = lessons.findIndex((entry) => entry.session === session.value);
  const lesson = lessons[index];
  if (lesson === undefined) throw data(null, { status: 404 });
  const input = { request, url, classId: params.classId, now: new Date() };
  const activity = lessonActivityOf(lesson.session);
  return {
    classId,
    lesson,
    terms: lessonTerms(lesson, content.terms),
    previous: lessons[index - 1],
    next: lessons[index + 1],
    practice:
      activity === undefined || activity === "trading"
        ? undefined
        : readLessonPractice(context, { ...input, activity }),
    trading:
      activity === "trading" ? readLearningTrade(context, input) : undefined,
    returnTo: readLearningReturnPath(url.searchParams.get("returnTo"), url),
  };
}

export default function LessonPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return <LessonView {...loaderData} />;
}
