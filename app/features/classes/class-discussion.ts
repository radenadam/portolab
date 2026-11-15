import { marketIndex } from "~/features/market-data/tracked-instruments";
import { compareRoundedNumbers } from "~/compare-rounded-numbers";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { marketBeta } from "~/units/beta";
import {
  bondQuestions,
  fundQuestions,
  futuresQuestions,
  optionQuestions,
} from "./class-discussion-questions";
import type { ClassCalendar, SessionNumber } from "./course-calendar";
import { courseSessionTitle } from "./course-session-title";
import type { ClassDiscussion, TeachingStudent } from "./class-teaching";
import type { classSummary } from "./class-summary";
import { extremeOf } from "./extreme-of";

const discussionSessions = [9, 10, 11, 12, 13, 14] as const;
type DiscussionSession = (typeof discussionSessions)[number];

export function classDiscussion(
  students: readonly TeachingStudent[],
  {
    calendar,
    summary,
    now,
    lessonSessions,
  }: {
    calendar: ClassCalendar | undefined;
    summary: ReturnType<typeof classSummary>;
    now: Date;
    lessonSessions: readonly SessionNumber[];
  },
): ClassDiscussion {
  const empty = { badge: undefined, lesson: undefined, questions: [] };
  if (calendar === undefined)
    return { ...empty, notice: m.classes_discussion_no_calendar_notice() };
  const notices: Record<typeof calendar.week.kind, () => string | undefined> = {
    ahead: m.classes_discussion_ahead_notice,
    over: m.classes_discussion_over_notice,
    session: () => undefined,
  };
  const notice = notices[calendar.week.kind]();
  if (notice !== undefined) return { ...empty, notice };
  const session = calendar.week.session;
  const badge = m.classes_discussion_session_label({
    session: formatNumber(session),
  });
  if (!lessonSessions.includes(session))
    return {
      ...empty,
      badge,
      notice: m.classes_discussion_no_lesson_notice({
        title: courseSessionTitle(session),
      }),
    };
  const lesson =
    discussionSessions.filter((number) => number <= session).at(-1) ??
    discussionSessions[0];
  const questions = questionsFor(lesson, students, { summary, now });
  return { badge, notice: undefined, lesson, questions };
}

function questionsFor(
  lesson: DiscussionSession,
  students: readonly TeachingStudent[],
  { summary, now }: { summary: ReturnType<typeof classSummary>; now: Date },
): string[] {
  switch (lesson) {
    case 9:
      return [betaQuestion(students), alphaQuestion(students)];
    case 10:
      return [betaQuestion(students), leaderQuestion(students)];
    case 11:
      return futuresQuestions(students, summary);
    case 12:
      return fundQuestions(students);
    case 13:
      return optionQuestions(students);
    case 14:
      return bondQuestions(students, now);
  }
}

function betaQuestion(students: readonly TeachingStudent[]): string {
  const measured = measuredRisks(students);
  const first = measured[0];
  if (first === undefined) return m.classes_beta_empty_notice();
  if (measured.length === 1)
    return m.classes_one_beta_portfolio_notice({
      beta: formatBeta(first.beta),
      move: formatPercent(0.01),
      index: marketIndex.code,
    });
  const calmer = measured.filter(
    (risk) => compareRoundedNumbers(risk.beta, marketBeta, "ratio") === "fall",
  ).length;
  const inputs = {
    count: formatNumber(measured.length),
    calmer: formatNumber(calmer),
    beta: formatBeta(marketBeta),
  };
  if (calmer === measured.length)
    return m.classes_several_defensive_portfolios_notice(inputs);
  if (calmer === 0)
    return m.classes_several_market_beta_portfolios_notice(inputs);
  const share = calmer / measured.length;
  const question =
    share >= 0.75
      ? m.classes_beta_defensive_part()
      : share <= 0.25
        ? m.classes_beta_volatile_part()
        : m.classes_beta_groups_part();
  return calmer === 1
    ? m.classes_one_calmer_portfolio_notice({ ...inputs, question })
    : m.classes_several_calmer_portfolios_notice({ ...inputs, question });
}

function alphaQuestion(students: readonly TeachingStudent[]): string {
  const measured = measuredRisks(students);
  const first = measured[0];
  if (first === undefined) return m.classes_alpha_empty_notice();
  if (measured.length === 1) {
    const inputs = { alpha: formatSignedPercent(first.alpha).text };
    switch (formatSignedPercent(first.alpha).direction) {
      case "rise":
        return m.classes_one_above_line_portfolio_notice(inputs);
      case "fall":
        return m.classes_one_below_line_portfolio_notice(inputs);
      case "none":
        return m.classes_one_on_line_portfolio_notice(inputs);
    }
  }
  const negative = measured.filter(
    (risk) => formatSignedPercent(risk.alpha).direction === "fall",
  ).length;
  const positive = measured.filter(
    (risk) => formatSignedPercent(risk.alpha).direction === "rise",
  ).length;
  const inputs = {
    count: formatNumber(measured.length),
    negative: formatNumber(negative),
  };
  if (positive === measured.length)
    return m.classes_several_positive_alpha_portfolios_notice(inputs);
  if (negative === measured.length)
    return m.classes_several_negative_alpha_portfolios_notice(inputs);
  if (negative === 0)
    return m.classes_several_nonnegative_alpha_portfolios_notice(inputs);
  return negative === 1
    ? m.classes_one_negative_alpha_notice(inputs)
    : m.classes_several_negative_alphas_notice(inputs);
}

function leaderQuestion(students: readonly TeachingStudent[]): string {
  const measured = students.filter(
    (student) => student.risk !== undefined && student.return !== undefined,
  );
  const top = extremeOf(measured, (student) => student.return, true);
  const best = extremeOf(measured, (student) => student.risk?.alpha, true);
  if (top?.return === undefined || best?.risk === undefined)
    return m.classes_leader_empty_notice();
  const inputs = {
    name: `\u0000${String(top.id)}\u0000`,
    change: formatSignedPercent(top.return).text,
    alpha: formatSignedPercent(best.risk.alpha).text,
  };
  if (measured.length === 1)
    return m.classes_one_measured_portfolio_notice(inputs);
  const question =
    top.id === best.id
      ? m.classes_leader_same_notice(inputs)
      : m.classes_leader_different_notice({
          ...inputs,
          best: `\u0000${String(best.id)}\u0000`,
        });
  const topReturn = top.return;
  const higherOutside = students.some(
    (student) => student.return !== undefined && student.return > topReturn,
  );
  return higherOutside
    ? m.classes_several_measured_portfolios_notice({ question })
    : question;
}

function measuredRisks(students: readonly TeachingStudent[]) {
  return students.flatMap((student) =>
    student.risk === undefined ? [] : [student.risk],
  );
}
