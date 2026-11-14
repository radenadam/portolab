import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseStudentOptions } from "./parse-student-options";
import { studentsAddress } from "./students-address";
import { rankingMeasures } from "./ranking-measure";
import { studentFilters } from "./student-filters";
import { fieldMaximumLength } from "~/form-size";

test("reads every ranking and filter, keeps the search and student in the address, and defaults to Jensen", () => {
  for (const measure of rankingMeasures) {
    for (const filter of studentFilters) {
      expect(
        parseStudentOptions(
          new URLSearchParams({ measure, filter }),
          "students",
        ),
      ).toEqual({ ok: true, value: { measure, filter, studentId: undefined } });
    }
  }
  expect(parseStudentOptions(new URLSearchParams(), "students")).toEqual({
    ok: true,
    value: { measure: "alpha", filter: "all", studentId: undefined },
  });
  const options = successValueForTest(
    parseStudentOptions(
      new URLSearchParams({
        measure: "treynor",
        filter: "inactive",
        q: "Sari & Eko",
        student: "7",
      }),
      "students",
    ),
    "The controls are valid",
  );
  const url = new URL(
    studentsAddress(1 as ClassId, { ...options, query: "Sari & Eko" }),
    "http://localhost",
  );
  expect(url.pathname).toBe("/classes/1/students");
  expect(url.hash).toBe("#selected-student");
  expect(parseStudentOptions(url.searchParams, "students")).toEqual({
    ok: true,
    value: options,
  });
});

test("refuses oversized controls before quoting them and names an input of the wrong shape", () => {
  const value = "W".repeat(fieldMaximumLength + 1);
  expect(
    parseStudentOptions(
      new URLSearchParams({ measure: value, filter: value }),
      "students",
    ),
  ).toEqual({
    ok: false,
    failure:
      "students.measure must be a ranking control, but it has 8001 characters, more than this input takes. students.filter must be a ranking control, but it has 8001 characters, more than this input takes.",
  });
  expect(parseStudentOptions(null, "students")).toEqual({
    ok: false,
    failure: "students must be URL search parameters, but it is null.",
  });
});

test("rejects unknown controls and malformed student ids together", () => {
  const parsed = parseStudentOptions(
    new URLSearchParams({
      measure: "return",
      filter: "unknown",
      student: "-1",
    }),
    "students",
  );
  expect(parsed).toEqual({
    ok: false,
    failure:
      'students.measure must be "alpha", "sharpe", or "treynor", but it is "return". students.filter must be "all", "below-market", "inactive", "high-beta", or "no-stocks", but it is "unknown". students.student must be a positive whole number, but it is "-1".',
  });
});
