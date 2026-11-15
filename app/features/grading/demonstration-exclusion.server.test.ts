import { expect, test } from "vitest";
import { listStudents } from "~/features/classes/class-store.server";
import { classMapPoints } from "~/features/classes/class-map-points.server";
import { readClassOverview } from "~/features/classes/read-class-overview.server";
import type { ClassMapAxis } from "~/features/classes/parse-class-map-axis";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import {
  placedOrderForTest,
  storeHoldingsForTest,
} from "~/features/trading/portfolios-for-test.server";
import { purchaseForTest } from "~/features/trading/orders-for-test";
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
  now: new Date("2026-11-02T03:01:00Z"),
  delayMinutes: 10,
};

const readers: { name: string; read: (fixture: ClassFixture) => unknown }[] = [
  {
    name: "class map with beta",
    read: (fixture) => readMap(fixture, "beta"),
  },
  {
    name: "class map with standard deviation",
    read: (fixture) => readMap(fixture, "deviation"),
  },
  {
    name: "class statistic strip",
    read: (fixture) => {
      const overview = overviewOf(fixture);
      expect(overview.students).toHaveLength(6);
      expect(overview.active).toBe(0);
      expect(overview.ordersThisWeek).toBe(0);
      return overview;
    },
  },
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
    placedOrderForTest(database, owner, purchaseForTest());
    const portfolio = readPortfolio(database, owner);
    expect(portfolio.holdings).toHaveLength(1);
    expect(portfolio.orders).toHaveLength(1);
    expect(portfolio.orders[0]?.placedAt).toEqual(
      new Date("2026-11-02T03:00:00Z"),
    );
    const { valuation } = readPortfolioValuation(database, {
      portfolio,
      startingCash: owner.startingCash,
    });
    const measured = readPortfolioMeasures(database, valuation);
    expect(measured.kind === "measured" && measured.measures.ok).toBe(true);
    expect(reader.read(fixture)).toEqual(before);
  });
}

function overviewOf({ database, taughtClass }: ClassFixture) {
  return readClassOverview(database, taughtClass, moment);
}

function readMap(fixture: ClassFixture, axis: ClassMapAxis) {
  const points = classMapPoints(overviewOf(fixture), {
    axis,
    classId: fixture.taughtClass.id,
  });
  expect(points).toHaveLength(3);
  return points;
}
