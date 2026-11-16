import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  parseLessonTask,
  lessonTaskReturnPath,
  withLessonTask,
} from "./lesson-task";

test("parses only implemented tasks and returns to the practice anchor", () => {
  const classId = 7 as ClassId;
  for (const task of [9, 10] as const) {
    expect(parseLessonTask(String(task), "lessonTask")).toEqual({
      ok: true,
      value: task,
    });
    expect(lessonTaskReturnPath(classId, task)).toBe(
      `/classes/7/learn/${String(task)}#practice`,
    );
    expect(withLessonTask("/classes/7/stocks/BBCA?range=3m", task)).toBe(
      `/classes/7/stocks/BBCA?range=3m&lessonTask=${String(task)}`,
    );
  }
  expect(parseLessonTask(null, "lessonTask")).toEqual({
    ok: true,
    value: undefined,
  });
  expect(withLessonTask("/classes/7/market", undefined)).toBe(
    "/classes/7/market",
  );
  for (const value of ["2", "09", 9, undefined, ""])
    expect(parseLessonTask(value, "lessonTask").ok).toBe(false);
  expect(parseLessonTask("11", "lessonTask")).toEqual({
    ok: false,
    failure:
      'lessonTask must name the practice of session 9 or 10, but it is "11".',
  });
  for (const length of [3, 100_000])
    expect(parseLessonTask("9".repeat(length), "lessonTask")).toEqual({
      ok: false,
      failure: `lessonTask must name the practice of session 9 or 10, but it has ${String(length)} characters.`,
    });
});
