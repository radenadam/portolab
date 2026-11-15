import { classOfStudentsForTest } from "~/features/grading/class-of-students-for-test.server";
import { readClassOverview } from "./read-class-overview.server";
import { classMapPath } from "./class-path";

export async function classOverviewForTest() {
  const fixture = await classOfStudentsForTest();
  return {
    ...fixture,
    overview: readClassOverview(fixture.database, fixture.taughtClass, {
      request: new Request("http://localhost/"),
      now: new Date("2026-10-30T09:20:00Z"),
      delayMinutes: 10,
      sourcePath: classMapPath(fixture.taughtClass.id, "beta"),
    }),
  };
}
