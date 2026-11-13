import type { ReactNode } from "react";
import type { Role } from "~/features/accounts/accounts.schema";
import {
  formatCalendarDate,
  formatCalendarDatePart,
  formatNumber,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { sessionCount } from "./course-calendar";
import type {
  ClassCalendar,
  CourseWeek,
  SessionNumber,
  Term,
} from "./course-calendar";

const sessionTitles: Record<SessionNumber, () => string> = {
  1: m.classes_basic_concepts_session_title,
  2: m.classes_portfolio_theory_session_title,
  3: m.classes_time_value_session_title,
  4: m.classes_capital_market_session_title,
  5: m.classes_market_instruments_session_title,
  6: m.classes_trading_mechanism_session_title,
  7: m.classes_proposal_review_session_title,
  8: m.classes_midterm_exam_session_title,
  9: m.classes_capm_session_title,
  10: m.classes_portfolio_risk_session_title,
  11: m.classes_futures_session_title,
  12: m.classes_mutual_funds_session_title,
  13: m.classes_options_session_title,
  14: m.classes_bonds_session_title,
  15: m.classes_article_review_session_title,
  16: m.classes_final_exam_session_title,
};

/** What the page of a class says about its calendar: the semester of the class and the session of the week. While the lecturer has not set the date of session 1, it says that Portolab cannot show the session of the week yet, in the words for the role of the reader. */
export function CourseCalendarNotice({
  calendar,
  role,
}: {
  calendar: ClassCalendar | undefined;
  role: Role;
}): ReactNode {
  if (calendar === undefined) {
    return <p>{noCalendarText(role)}</p>;
  }
  return (
    <>
      <p>{m.classes_term_notice({ term: termText(calendar.term) })}</p>
      <p>{weekText(calendar.week)}</p>
    </>
  );
}

function noCalendarText(role: Role): string {
  switch (role) {
    case "lecturer":
      return m.classes_lecturer_no_calendar_notice();
    case "student":
      return m.classes_student_no_calendar_notice();
  }
}

function termText(term: Term): string {
  const years = {
    firstYear: formatCalendarDatePart(term.academicYear.from, "year"),
    secondYear: formatCalendarDatePart(term.academicYear.until, "year"),
  };
  switch (term.semester) {
    case "odd":
      return m.classes_odd_term_part(years);
    case "even":
      return m.classes_even_term_part(years);
  }
}

function weekText(week: CourseWeek): string {
  const session = {
    session: formatNumber(week.session),
    title: sessionTitles[week.session](),
    date: formatCalendarDate(week.date, "weekday"),
  };
  switch (week.kind) {
    case "ahead":
      return m.classes_course_ahead_notice(session);
    case "session":
      return m.classes_course_session_notice({
        ...session,
        count: formatNumber(sessionCount),
      });
    case "over":
      return m.classes_course_over_notice(session);
  }
}
