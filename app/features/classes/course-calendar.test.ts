import { expect, test } from "vitest";
import { classCalendarOf } from "./course-calendar";

// Session 1 of this class meets on Saturday 12 September 2026, so its week runs from Monday 7 September to Sunday 13 September, and session 16 meets on Saturday 26 December 2026. A day in WIB starts at 17:00 UTC of the day before.
const saturdayClass = "2026-09-12";

function weekAt(firstSessionDate: string, moment: string) {
  return classCalendarOf(firstSessionDate, new Date(moment))?.week;
}

test("gives no calendar to a class whose lecturer has not set the date of session 1", () => {
  expect(
    classCalendarOf(null, new Date("2026-11-14T03:00:00.000Z")),
  ).toBeUndefined();
});

test("names session 1 ahead of the course until the Monday of its week starts in WIB", () => {
  for (const moment of [
    "2026-01-01T00:00:00.000Z",
    "2026-09-06T16:59:59.999Z",
  ]) {
    expect(weekAt(saturdayClass, moment), moment).toEqual({
      kind: "ahead",
      session: 1,
      date: "2026-09-12",
    });
  }
});

test("names the session of each week from its Monday to its Sunday in WIB, before and after the day when it meets", () => {
  for (const [moment, session, date] of [
    ["2026-09-06T17:00:00.000Z", 1, "2026-09-12"],
    ["2026-09-12T03:00:00.000Z", 1, "2026-09-12"],
    ["2026-09-13T16:59:59.999Z", 1, "2026-09-12"],
    ["2026-09-13T17:00:00.000Z", 2, "2026-09-19"],
    ["2026-10-18T17:00:00.000Z", 7, "2026-10-24"],
    ["2026-10-31T03:00:00.000Z", 8, "2026-10-31"],
    ["2026-11-01T16:59:59.999Z", 8, "2026-10-31"],
    ["2026-11-01T17:00:00.000Z", 9, "2026-11-07"],
    ["2026-11-14T03:00:00.000Z", 10, "2026-11-14"],
    ["2026-12-13T17:00:00.000Z", 15, "2026-12-19"],
    ["2026-12-20T17:00:00.000Z", 16, "2026-12-26"],
    ["2026-12-27T16:59:59.999Z", 16, "2026-12-26"],
  ] as const) {
    expect(weekAt(saturdayClass, moment), moment).toEqual({
      kind: "session",
      session,
      date,
    });
  }
});

test("names the last session after the course from the Monday after its week in WIB", () => {
  for (const moment of [
    "2026-12-27T17:00:00.000Z",
    "2027-06-01T03:00:00.000Z",
  ]) {
    expect(weekAt(saturdayClass, moment), moment).toEqual({
      kind: "over",
      session: 16,
      date: "2026-12-26",
    });
  }
});

test("counts the weeks of a class that meets on Monday or on Sunday from the Monday of the week of session 1", () => {
  expect(weekAt("2026-09-07", "2026-09-06T16:59:59.999Z")).toEqual({
    kind: "ahead",
    session: 1,
    date: "2026-09-07",
  });
  expect(weekAt("2026-09-07", "2026-11-15T16:59:59.999Z")).toEqual({
    kind: "session",
    session: 10,
    date: "2026-11-09",
  });
  expect(weekAt("2026-09-13", "2026-09-06T17:00:00.000Z")).toEqual({
    kind: "session",
    session: 1,
    date: "2026-09-13",
  });
  expect(weekAt("2026-09-13", "2026-12-27T17:00:00.000Z")).toEqual({
    kind: "over",
    session: 16,
    date: "2026-12-27",
  });
});

test("names the odd semester for a session 1 from July to December and the even semester for one from January to June, in the academic year from July to June", () => {
  const moment = new Date("2026-11-14T03:00:00.000Z");
  for (const [firstSessionDate, term] of [
    [
      "2026-07-01",
      {
        semester: "odd",
        academicYear: { from: "2026-07-01", until: "2027-06-30" },
      },
    ],
    [
      "2026-09-12",
      {
        semester: "odd",
        academicYear: { from: "2026-07-01", until: "2027-06-30" },
      },
    ],
    [
      "2026-12-31",
      {
        semester: "odd",
        academicYear: { from: "2026-07-01", until: "2027-06-30" },
      },
    ],
    [
      "2027-01-01",
      {
        semester: "even",
        academicYear: { from: "2026-07-01", until: "2027-06-30" },
      },
    ],
    [
      "2027-06-30",
      {
        semester: "even",
        academicYear: { from: "2026-07-01", until: "2027-06-30" },
      },
    ],
    [
      "2026-06-30",
      {
        semester: "even",
        academicYear: { from: "2025-07-01", until: "2026-06-30" },
      },
    ],
    [
      "2028-02-29",
      {
        semester: "even",
        academicYear: { from: "2027-07-01", until: "2028-06-30" },
      },
    ],
  ] as const) {
    expect(
      classCalendarOf(firstSessionDate, moment)?.term,
      firstSessionDate,
    ).toEqual(term);
  }
});
