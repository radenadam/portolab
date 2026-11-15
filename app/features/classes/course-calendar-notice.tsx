import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { Role } from "~/features/accounts/accounts.schema";
import { formatCalendarDate, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { sessionCount } from "./course-calendar";
import type { ClassCalendar, CourseWeek } from "./course-calendar";
import { termText } from "./term-text";
import { courseSessionTitle } from "./course-session-title";

/** What the page of a class says about its calendar: the semester of the class and the session of the week. While the lecturer has not set the date of session 1, it says that Portolab cannot show the session of the week yet, in the words for the role of the reader. */
export function CourseCalendarNotice({
  calendar,
  role,
}: {
  calendar: ClassCalendar | undefined;
  role: Role;
}): ReactNode {
  if (calendar === undefined) {
    return (
      <p>
        <NumberText>{noCalendarText(role)}</NumberText>
      </p>
    );
  }
  return (
    <>
      <p>
        <NumberText>
          {m.classes_term_notice({
            term: termText(calendar.term, "inSentence"),
          })}
        </NumberText>
      </p>
      <p>
        <NumberText>{weekText(calendar.week)}</NumberText>
      </p>
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

function weekText(week: CourseWeek): string {
  const session = {
    session: formatNumber(week.session),
    title: courseSessionTitle(week.session),
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
