import { expect, test } from "vitest";
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
    const path = `/classes/7/students?${query.toString()}#selected-student`;
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
