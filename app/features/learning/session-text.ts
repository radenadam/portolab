import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { courseSessionTitle } from "../classes/course-session-title";
import type { SessionContent, SessionKind } from "./content";

export function sessionLabel(lesson: SessionContent): string {
  return courseSessionTitle(lesson.session, "short");
}

export function sessionKindLabel(
  kind: SessionKind,
  current = false,
  practice = false,
): string {
  const labels: Record<SessionKind, () => string> = {
    short: m.learning_summary_label,
    full: m.learning_lesson_label,
    review: m.learning_review_label,
    exam: m.learning_exam_label,
  };
  const label = practice ? m.learning_interactive_label() : labels[kind]();
  return current ? m.learning_this_week_label({ kind: label }) : label;
}

export function lessonLinkText(lesson: SessionContent): string {
  return m.learning_lesson_link({
    session: formatNumber(lesson.session),
    title: lesson.title,
  });
}
