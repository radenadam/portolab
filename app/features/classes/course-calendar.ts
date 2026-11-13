import {
  addDays,
  startOfMonth,
  startOfUtcDate,
  startOfWeek,
} from "~/calendar-dates";
import { dayMilliseconds } from "~/time-units";
import { wibDateOf } from "~/wib";

// The sessions of the course in the order in which they meet, one a week, as decision 0032 lists them.
const sessionNumbers = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
] as const;

/** A session of the course, by its number. */
export type SessionNumber = (typeof sessionNumbers)[number];

/** The number of sessions of the course, which is the number of its last session. */
export const sessionCount: SessionNumber = sessionNumbers.length;

const daysPerWeek = 7;

/** Where a week lies in the course of a class, with the session that it names. */
export interface CourseWeek {
  /** Whether the week comes before the week of session 1, is the week of a session, or comes after the week of the last session. */
  kind: "ahead" | "session" | "over";
  /** Session 1 before the course, the session of the week during the course, and the last session after it. */
  session: SessionNumber;
  /** The calendar date when that session meets. */
  date: string;
}

/** The semester of a class and its academic year, such as the odd semester of 2026/2027. */
export interface Term {
  /** The half of the academic year in which the class runs. The odd semester starts in the second half of a calendar year, and the even semester in the first half of the next one. */
  semester: "odd" | "even";
  /** The first and the last day of the academic year, such as 2026-07-01 and 2027-06-30. */
  academicYear: { from: string; until: string };
}

/** The calendar of a class at a moment: its term, and the week of its course. */
export interface ClassCalendar {
  term: Term;
  week: CourseWeek;
}

// July, as the months of a JavaScript date count from 0 for January. Decision 0032 explains why the half of the year in which session 1 meets names the semester.
const academicYearStartMonth = 6;
const monthsPerSemester = 6;
const monthsPerYear = 12;

/** The calendar of a class at a moment, or none for a class whose lecturer has not set the date of its first session. */
export function classCalendarOf(
  firstSessionDate: string | null,
  now: Date,
): ClassCalendar | undefined {
  return firstSessionDate === null
    ? undefined
    : {
        term: termOf(firstSessionDate),
        week: courseWeekOf(firstSessionDate, now),
      };
}

/** The week of the course of a class at a moment. A week runs from Monday to Sunday in WIB, and its session is the one that meets in it, so a session is the session of the week on the days before its meeting as well. */
function courseWeekOf(firstSessionDate: string, now: Date): CourseWeek {
  // Both dates are Mondays at midnight in UTC, which has no daylight saving time, so they lie a whole number of weeks apart.
  const weeksSinceFirstSession =
    (startOfUtcDate(startOfWeek(wibDateOf(now))).getTime() -
      startOfUtcDate(startOfWeek(firstSessionDate)).getTime()) /
    (daysPerWeek * dayMilliseconds);
  const session = sessionNumbers[weeksSinceFirstSession];
  if (session !== undefined) {
    return {
      kind: "session",
      session,
      date: sessionDate(firstSessionDate, session),
    };
  }
  if (weeksSinceFirstSession < 0) {
    return {
      kind: "ahead",
      session: sessionNumbers[0],
      date: firstSessionDate,
    };
  }
  return {
    kind: "over",
    session: sessionCount,
    date: sessionDate(firstSessionDate, sessionCount),
  };
}

/** The term of a class from the date of its first session: the odd semester when session 1 meets from July to December, and the even semester when it meets from January to June. */
function termOf(firstSessionDate: string): Term {
  const monthsIntoAcademicYear =
    (startOfUtcDate(firstSessionDate).getUTCMonth() -
      academicYearStartMonth +
      monthsPerYear) %
    monthsPerYear;
  const from = startOfMonth(firstSessionDate, -monthsIntoAcademicYear);
  return {
    semester: monthsIntoAcademicYear < monthsPerSemester ? "odd" : "even",
    academicYear: {
      from,
      until: addDays(startOfMonth(from, monthsPerYear), -1),
    },
  };
}

/** The calendar date when a session meets, a whole number of weeks after session 1. */
function sessionDate(firstSessionDate: string, session: SessionNumber): string {
  return addDays(firstSessionDate, (session - 1) * daysPerWeek);
}
