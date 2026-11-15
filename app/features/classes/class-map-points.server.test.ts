import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { expect, test } from "vitest";
import { classOfStudentsForTest } from "~/features/grading/class-of-students-for-test.server";
import { readClassOverview } from "./read-class-overview.server";
import { classMapPoints } from "./class-map-points.server";
import { classMapPath } from "./class-path";

// By hand, Eko's Rp50,525,900 in cash and 10,000 BBCA shares at Rp4,980 total Rp100,325,900. Against the starting Rp100,000,000, the return rounds to +0.33%.
const returns: Record<Locale, string> = { id: "+0,33%", en: "+0.33%" };
test("names notable students by identity and adds their return in both languages when names repeat", async () => {
  const { database, taughtClass } = await classOfStudentsForTest();
  for (const locale of locales) {
    switchLocaleForTest(locale);
    const overview = readClassOverview(database, taughtClass, {
      request: new Request("http://localhost/"),
      now: new Date("2026-10-30T09:20:00Z"),
      delayMinutes: 10,
      sourcePath: classMapPath(taughtClass.id, "beta"),
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
    const named = points.filter(({ label }) => label === repeated);
    expect(named).toHaveLength(1);
    expect(named[0]?.labelValue).toBe(returns[locale]);
  }
});
