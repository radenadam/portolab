import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { SessionNumber } from "../classes/course-calendar";
import type { SessionContent, SessionKind } from "./content";

export function sessionLabel(lesson: SessionContent): string {
  const labels: Record<SessionNumber, (session: SessionNumber) => string> = {
    1: numberedSession,
    2: numberedSession,
    3: numberedSession,
    4: numberedSession,
    5: numberedSession,
    6: numberedSession,
    7: numberedSession,
    8: () => m.learning_midterm_label(),
    9: numberedSession,
    10: numberedSession,
    11: numberedSession,
    12: numberedSession,
    13: numberedSession,
    14: numberedSession,
    15: numberedSession,
    16: () => m.learning_final_label(),
  };
  return labels[lesson.session](lesson.session);
}

function numberedSession(session: SessionNumber): string {
  return m.learning_session_label({ session: formatNumber(session) });
}

export function sessionKindLabel(kind: SessionKind, current = false): string {
  const labels: Record<SessionKind, () => string> = {
    short: m.learning_summary_label,
    full: m.learning_lesson_label,
    review: m.learning_review_label,
    exam: m.learning_exam_label,
  };
  const label = labels[kind]();
  return current ? m.learning_this_week_label({ kind: label }) : label;
}

export function lessonLinkText(lesson: SessionContent): string {
  return m.learning_lesson_link({
    session: formatNumber(lesson.session),
    title: lesson.title,
  });
}
