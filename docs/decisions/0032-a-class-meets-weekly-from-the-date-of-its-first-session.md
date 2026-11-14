# 0032. A class meets weekly from the date of its first session

- Status: Accepted. [Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) changes the placement of the student's class calendar notice.
- Date: 2026-11-14

## Context

The design that the maintainer approved on 13 November 2026 names the session of the course on several screens: a badge such as "Sesi 9" beside a sentence about the portfolio, the sessions along the top of the chart of a portfolio over time, the lesson of the week among the lessons, and the questions for discussion of the week on the page of the class. So a class must know which session meets in each week. The course has 16 sessions, one a week, and its plan gives the topic of each. Postgraduate students often meet on weekday evenings and Saturdays, as [the product brief](../product.md) says, so a class can meet on any day of the week. A university in Indonesia names the two semesters of an academic year Ganjil (odd) and Genap (even), and the design shows the term beside the name of the class.

## Decision

- The lecturer gives the date of session 1 when creating a class, and changes it on the page of the calendar of the class. Each later session meets one week after the one before, until session 16.
- The course plan gives the topic of each session:

  | Session | Topic                                        |
  | ------- | -------------------------------------------- |
  | 1       | Basic concepts of portfolio management       |
  | 2       | Portfolio theory                             |
  | 3       | The time value of money                      |
  | 4       | The capital market                           |
  | 5       | Instruments of the capital market            |
  | 6       | The mechanism of trading                     |
  | 7       | Review of the research proposal              |
  | 8       | Midterm exam and the final research proposal |
  | 9       | CAPM and the security market line            |
  | 10      | Portfolio return and risk                    |
  | 11      | Forwards and futures                         |
  | 12      | Mutual funds                                 |
  | 13      | Options                                      |
  | 14      | Bonds                                        |
  | 15      | Review of the research article               |
  | 16      | Final exam and the final research article    |

  Sessions 7 and 15 review the research proposal and the research article of each student, and in sessions 8 and 16, the exams, the students submit the final proposal and the final article. None of the four is a lesson of the simulator.

- A week runs from Monday to Sunday in WIB, and the session of a week is the one that meets in it, also on the days before its meeting. Before the week of session 1 the course lies ahead, and after the week of session 16 it is over. The calendar names session 1 ahead of the course, the session of the week during it, and session 16 after it, each with its topic and the day when it meets.
- The term follows from the month of session 1. Session 1 from July to December makes the odd semester, and from January to June the even semester, of the academic year from July to June, such as 2026/2027. A university in Indonesia starts its odd semester in August or September and its even semester from January to March, so the half of the year names the semester, however early or late the semester starts.
- The field of the date takes a date at most 365 days before or after the day on which the lecturer gives it, because a class runs in the current semester or a near one, so a date further away is most likely a mistyped year.
- A class that Portolab created before it stored the date has none. Its calendar is unavailable until the lecturer sets the date.
- The page of the calendar is below the page of the class, as the page that resets the password of a student is.

## Alternatives

- **A date for each session.** A lecturer could move a single session that a holiday cancels, but would type 16 dates for a course that meets on the same day each week, and a mistyped date would put two sessions in one week.
- **The week of session 1 instead of its date.** The prototype counts the weeks from a Monday. The day of session 1 lets the page say on which day a session meets, at no cost to the lecturer.
- **The session of a meeting until the next meeting.** For a class that meets on Saturday, session 9 would last from its Saturday to the next Friday, so the days before session 10 would still name session 9. A student prepares for the session of the week before it meets, and the design names the lesson of this week.
- **A term that the lecturer chooses.** It would be a second field that could disagree with the date of session 1.
- **A date without limits.** A mistyped year, such as 2062, would put the whole course far from the semester that the class runs in, and the page would only show it after the lecturer saved it.

## Consequences

- A holiday does not move the sessions after it, and its week still counts as the week of its session. A lecturer whose class skips a week moves session 1 one week later, so the later sessions follow, but the page then names a later day for session 1 than the one on which it met.
- Every class follows the same 16 topics, as the course plan gives them.
