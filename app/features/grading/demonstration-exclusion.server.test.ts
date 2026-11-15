import { expect, test } from "vitest";
import { listStudents } from "~/features/classes/class-store.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { storeHoldingsForTest } from "~/features/trading/portfolios-for-test.server";
import { readPortfolio } from "~/features/trading/portfolio-store.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { orderStudents } from "./order-students";
import { portfoliosWorksheet } from "./portfolios-worksheet";
import { readAnonymousClassmates } from "./read-anonymous-classmates.server";
import { readClassPortfolios } from "./read-class-portfolios.server";

type ClassFixture = Awaited<ReturnType<typeof classOfStudentsForTest>>;
const moment = {
  request: new Request("http://localhost/classes/1"),
  now: new Date("2026-10-30T09:20:00Z"),
  delayMinutes: 10,
};

const readers: { name: string; read: (fixture: ClassFixture) => unknown }[] = [
  {
    name: "ranking",
    read: ({ database, taughtClass }) =>
      orderStudents(
        readClassPortfolios(database, taughtClass, moment),
        "alpha",
      ),
  },
  {
    name: "workbook",
    read: ({ database, taughtClass }) =>
      portfoliosWorksheet({
        className: taughtClass.name,
        portfolios: readClassPortfolios(database, taughtClass, moment),
        now: moment.now,
        source: { name: "Fixture", delayMinutes: moment.delayMinutes },
      }),
  },
  {
    name: "anonymous points of classmates on Beranda",
    read: ({ database, taughtClass }) => {
      const student = listStudents(database, taughtClass.id)[0];
      if (student === undefined)
        throw new Error("The class fixture has no student.");
      return readAnonymousClassmates(database, {
        ...moment,
        classId: taughtClass.id,
        startingCash: taughtClass.startingCash,
        membershipId: student.membershipId,
      });
    },
  },
];

for (const reader of readers) {
  test(`excludes a measured demonstration from the ${reader.name}`, async () => {
    const fixture = await classOfStudentsForTest();
    const { database, taughtClass } = fixture;
    const before = reader.read(fixture);
    expect(listStudents(database, taughtClass.id)).toHaveLength(6);
    const owner = {
      kind: "demonstration" as const,
      classId: taughtClass.id,
      startingCash: taughtClass.startingCash,
    };
    storeHoldingsForTest(database, owner, {
      cash: rupiah(50_125_300),
      holdings: [
        { code: "BBCA", shares: shares(10_000), cost: rupiah(49_874_700) },
      ],
    });
    const portfolio = readPortfolio(database, owner);
    expect(portfolio.holdings).toHaveLength(1);
    const { valuation } = readPortfolioValuation(database, {
      portfolio,
      startingCash: owner.startingCash,
    });
    const measured = readPortfolioMeasures(database, valuation);
    expect(measured.kind === "measured" && measured.measures.ok).toBe(true);
    expect(reader.read(fixture)).toEqual(before);
  });
}
