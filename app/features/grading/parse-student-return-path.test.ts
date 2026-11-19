import { expect, test } from "vitest";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { fieldMaximumLength } from "~/form-size";
import { parseStudentReturnPath } from "./parse-student-return-path";

const classId = 7 as ClassId;
const siteOrigin = "http://localhost:3000";

test("keeps a full search after URI encoding together with the selection and controls", () => {
  for (const character of ["W", "😀"]) {
    const query = new URLSearchParams({
      q: character.repeat(fieldMaximumLength),
      measure: "treynor",
      filter: "inactive",
      student: "11",
    });
    const path = `/classes/7/students?${query.toString()}#student-11`;
    expect(
      parseStudentReturnPath(path, "returnTo", { origin: siteOrigin, classId }),
    ).toEqual({ ok: true, value: path });
  }
});

test("refuses another page, another class, an external address, and an oversized address", () => {
  for (const path of ["/sign-in", "/classes/8/students", "/classes/8"]) {
    expect(
      parseStudentReturnPath(path, "returnTo", { origin: siteOrigin, classId }),
    ).toEqual({
      ok: false,
      failure: `returnTo must return to /classes/7/students or /classes/7, but it is "${path}".`,
    });
  }
  expect(
    parseStudentReturnPath(
      "https://example.com/classes/7/students",
      "returnTo",
      { origin: siteOrigin, classId },
    ).ok,
  ).toBe(false);
  expect(
    parseStudentReturnPath("W".repeat(fieldMaximumLength * 100), "returnTo", {
      origin: siteOrigin,
      classId,
    }),
  ).toEqual({
    ok: false,
    failure:
      "returnTo must be a path on this site of at most 128000 characters, but it has 800000.",
  });
});

test("keeps the class map axis when a student opens from the map", () => {
  for (const axis of ["beta", "deviation"]) {
    const path = `/classes/7?axis=${axis}`;
    expect(
      parseStudentReturnPath(path, "returnTo", { origin: siteOrigin, classId }),
    ).toEqual({ ok: true, value: path });
  }
});

test("returns to a page of the student that the page names, such as the page from which a reset of the password opened, and to no page of another student", () => {
  const studentId = 11 as UserId;
  for (const path of [
    "/classes/7/students/11?returnTo=%2Fclasses%2F7%2Fstudents",
    "/classes/7/students/11/analysis?axis=deviation",
    "/classes/7/students/11/journal?status=filled",
  ]) {
    expect(
      parseStudentReturnPath(path, "returnTo", {
        origin: siteOrigin,
        classId,
        studentId,
      }),
    ).toEqual({ ok: true, value: path });
  }
  expect(
    parseStudentReturnPath("/classes/7/students/12", "returnTo", {
      origin: siteOrigin,
      classId,
      studentId,
    }),
  ).toEqual({
    ok: false,
    failure:
      'returnTo must return to /classes/7/students or /classes/7 or /classes/7/students/11 or /classes/7/students/11/analysis or /classes/7/students/11/journal, but it is "/classes/7/students/12".',
  });
  expect(
    parseStudentReturnPath("/classes/7/students/11", "returnTo", {
      origin: siteOrigin,
      classId,
    }).ok,
  ).toBe(false);
});
