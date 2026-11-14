import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { readClassPortfolios } from "./read-class-portfolios.server";

export async function classRankingForTest() {
  const fixture = await classOfStudentsForTest();
  const now = new Date("2026-10-30T09:20:00Z");
  return {
    ...fixture,
    now,
    portfolios: readClassPortfolios(fixture.database, fixture.taughtClass, {
      request: new Request("http://localhost/classes/1/students"),
      now,
      delayMinutes: 10,
    }),
  };
}
