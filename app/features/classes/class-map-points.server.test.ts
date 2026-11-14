import { expect, test } from "vitest";
import { classOfStudentsForTest } from "~/features/grading/class-of-students-for-test.server";
import { readClassOverview } from "./read-class-overview.server";
import { classMapPoints } from "./class-map-points.server";

test("names notable students by their identity when two students share a name", async () => {
  const { database, taughtClass } = await classOfStudentsForTest();
  const overview = readClassOverview(database, taughtClass, {
    request: new Request("http://localhost/"),
    now: new Date("2026-10-30T09:20:00Z"),
    delayMinutes: 10,
  });
  const repeated = "Eko Prasetyo";
  overview.students = overview.students.map((student, index) =>
    index === 5 ? { ...student, name: repeated } : student,
  );
  expect(
    overview.students.filter(({ name }) => name === repeated),
  ).toHaveLength(2);
  const points = classMapPoints(overview, {
    axis: "beta",
    classId: taughtClass.id,
  });
  expect(points.filter(({ name }) => name === repeated)).toHaveLength(2);
  expect(points.filter(({ label }) => label === repeated)).toHaveLength(1);
});
