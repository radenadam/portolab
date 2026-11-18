import { expect, test } from "vitest";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { classRankingForTest } from "./class-ranking-for-test.server";
import { filterStudents, matchesStudentFilter } from "./student-filters";

test("compares returns over the student's own market period and beta against one, and combines name or username search with the filter", async () => {
  const { portfolios } = await classRankingForTest();
  const student = portfolios.ranked.find((member) => member.username === "eko");
  if (student?.total === undefined)
    throw new Error("The fixture has a measured portfolio.");
  for (const [returns, market, matches] of [
    [0.01, 0.02, true],
    [0.02, 0.02, false],
    [0.03, 0.02, false],
  ] as const) {
    expect(
      matchesStudentFilter(
        {
          ...student,
          total: { ...student.total, return: cumulativeReturn(returns) },
          marketReturn: cumulativeReturn(market),
        },
        "below-market",
      ),
    ).toBe(matches);
  }
  expect(
    matchesStudentFilter(
      { ...student, marketReturn: undefined },
      "below-market",
    ),
  ).toBe(false);
  for (const [value, matches] of [
    [0.9, false],
    [1, false],
    [1.1, true],
  ] as const) {
    expect(
      matchesStudentFilter(
        { ...student, measures: { ...student.measures, beta: beta(value) } },
        "high-beta",
      ),
    ).toBe(matches);
  }
  expect(
    filterStudents(portfolios.ranked, { query: "  EKO  ", filter: "all" }),
  ).toEqual([student]);
  expect(
    filterStudents(portfolios.ranked, {
      query: "prasetyo",
      filter: "no-stocks",
    }),
  ).toEqual([]);
});

test("searches a NIM without changing its letter case or leading zeroes", async () => {
  const { portfolios } = await classRankingForTest();
  const students = portfolios.ranked.map((student) => ({
    ...student,
    nim: student.username === "eko" ? "00Ab/12" : null,
  }));
  expect(
    filterStudents(students, { query: "  00aB/12  ", filter: "all" }).map(
      (student) => student.username,
    ),
  ).toEqual(["eko"]);
});
