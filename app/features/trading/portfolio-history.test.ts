import { expect, test } from "vitest";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { indexHistoryForTest } from "~/features/market-data/history-for-test";
import type {
  IndexHistory,
  StockHistory,
} from "~/features/market-data/price-source.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import type { Order } from "./order";
import { duringSessionForTest } from "./orders-for-test";
import {
  historyStartDate,
  marketReturnSinceStart,
  portfolioHistory,
} from "./portfolio-history";
import type { PortfolioHistory } from "./portfolio-history";
import { readPortfolio } from "./portfolio-store.server";
import {
  recordedBbcaForTest,
  recordedIhsgForTest,
  tradedPortfolioForTest,
} from "./traded-portfolio-for-test.server";

// The expected returns were computed with the decimal module of Python at 50 significant digits, from the cash and the shares that tradedPortfolioForTest describes and the recorded closes. Each moment is in WIB, for a source that lags 10 minutes behind the exchange, so the prices of a trading day are final from 16:26.
const delayMinutes = 10;
const startingCash = rupiah(100_000_000);

/** The orders of the traded portfolio, as the store reads them. A database of a test opens inside the test. */
async function tradedOrders(): Promise<Order[]> {
  const { database, owner } = await tradedPortfolioForTest();
  return readPortfolio(database, owner).orders;
}

/** The start of the history of the traded portfolio, whose student joined at 10:00 on Monday 2 November 2026. */
const startDate = successValueForTest(
  historyStartDate(duringSessionForTest),
  "IDX calendars cover November 2026",
);

/** A point of the history as a test expects it, with returns that match within the digits that a double holds. */
interface ExpectedPoint {
  date: string;
  portfolio: number;
  market: number;
}

const startPoint: ExpectedPoint = {
  date: "2026-10-30",
  portfolio: closeToForTest(0, 15),
  market: closeToForTest(0, 15),
};
const mondayPoint: ExpectedPoint = {
  date: "2026-11-02",
  portfolio: closeToForTest(-0.001494, 15),
  market: closeToForTest(0.00786624613163801, 15),
};
const tuesdayPoint: ExpectedPoint = {
  date: "2026-11-03",
  portfolio: closeToForTest(-0.030704, 15),
  market: closeToForTest(-0.03020733431546059, 15),
};

/** The history of the traded portfolio at a moment, with the recorded closes unless a test changes them. */
async function history(changes: {
  now: Date;
  market?: IndexHistory;
  stocks?: readonly StockHistory[];
  orders?: readonly Order[];
}): Promise<PortfolioHistory> {
  return portfolioHistory({
    startingCash,
    startDate,
    orders: changes.orders ?? (await tradedOrders()),
    market: recordedIhsgForTest(),
    stocks: [recordedBbcaForTest()],
    delayMinutes,
    ...changes,
  });
}

/** The history of a portfolio that holds only its starting cash, of a student who joined at a moment, which the test sees at a later moment, with the recorded closes of the IHSG unless a test gives others. */
function cashHistory(
  joinedAt: string,
  now: string,
  market: IndexHistory = recordedIhsgForTest(),
): PortfolioHistory {
  return portfolioHistory({
    startingCash,
    startDate: successValueForTest(
      historyStartDate(new Date(joinedAt)),
      `IDX calendars cover ${joinedAt}`,
    ),
    orders: [],
    market,
    stocks: [],
    now: new Date(now),
    delayMinutes,
  });
}

// Each case gives a moment of joining in WIB and the start of the history, which is the trading day before the first session in which the student could trade.
const starts: { name: string; joinedAt: string; start: string }[] = [
  {
    name: "before the market opens",
    joinedAt: "2026-11-02T00:00:00Z",
    start: "2026-10-30",
  },
  {
    name: "during session I",
    joinedAt: "2026-11-02T03:00:00Z",
    start: "2026-10-30",
  },
  {
    name: "in the break of a Monday",
    joinedAt: "2026-11-02T05:30:00Z",
    start: "2026-10-30",
  },
  {
    name: "in the break of a Friday, which ends later",
    joinedAt: "2026-10-30T06:30:00Z",
    start: "2026-10-29",
  },
  {
    name: "after session II of a Friday",
    joinedAt: "2026-10-30T09:05:00Z",
    start: "2026-10-30",
  },
  {
    name: "on a weekend",
    joinedAt: "2026-10-31T03:00:00Z",
    start: "2026-10-30",
  },
  // 24 and 25 December 2026 are holidays.
  {
    name: "on a holiday",
    joinedAt: "2026-12-24T03:00:00Z",
    start: "2026-12-23",
  },
];

for (const { name, joinedAt, start } of starts) {
  test(`starts the history of a student who joined ${name}`, () => {
    expect(historyStartDate(new Date(joinedAt))).toEqual({
      ok: true,
      value: start,
    });
  });
}

test("fails to start the history of a student who joined on a date that no calendar covers", () => {
  expect(historyStartDate(new Date("2028-01-03T03:00:00Z"))).toEqual({
    ok: false,
    failure: { kind: "missingCalendar" },
  });
});

test("replays a purchase and a sale at the final closes of each day, and waits for the next trading day while its prices are not final", async () => {
  // 10:00 on Wednesday 4 November 2026.
  expect(await history({ now: new Date("2026-11-04T03:00:00Z") })).toEqual({
    points: [startPoint, mondayPoint, tuesdayPoint],
    end: {
      kind: "notFinal",
      date: "2026-11-04",
      finalAt: new Date("2026-11-04T09:26:00Z"),
    },
  });
});

test("leaves out the close of a day until the minute in which its prices become final", async () => {
  // 16:25 and 16:26 on Tuesday 3 November 2026.
  expect(await history({ now: new Date("2026-11-03T09:25:00Z") })).toEqual({
    points: [startPoint, mondayPoint],
    end: {
      kind: "notFinal",
      date: "2026-11-03",
      finalAt: new Date("2026-11-03T09:26:00Z"),
    },
  });
  expect(
    (await history({ now: new Date("2026-11-03T09:26:00Z") })).points.at(-1),
  ).toEqual(tuesdayPoint);
});

test("waits over a weekend for the first trading day after the start", () => {
  // A student who joined after session II on Friday 30 October 2026 holds only cash at its close, and the history waits on Saturday for Monday.
  expect(cashHistory("2026-10-30T09:05:00Z", "2026-10-31T03:00:00Z")).toEqual({
    points: [startPoint],
    end: {
      kind: "notFinal",
      date: "2026-11-02",
      finalAt: new Date("2026-11-02T09:26:00Z"),
    },
  });
});

test("waits over holidays for the first trading day after them", () => {
  // A close of the IHSG on a day that has not come yet, invented for this test. A student who joined after session II on Wednesday 23 December 2026 holds only cash at its close, and on Saturday the history waits over the holidays of 24 and 25 December for Monday 28 December.
  const christmasIhsg = indexHistoryForTest(
    buildDailyHistory({ kind: "index", code: "IHSG" }, [["2026-12-23", 5000]]),
  );
  expect(
    cashHistory("2026-12-23T09:05:00Z", "2026-12-26T03:00:00Z", christmasIhsg),
  ).toEqual({
    points: [{ ...startPoint, date: "2026-12-23" }],
    end: {
      kind: "notFinal",
      date: "2026-12-28",
      finalAt: new Date("2026-12-28T09:26:00Z"),
    },
  });
});

test("has no return while the prices of the start are not final", () => {
  // A student who joined at 16:05 on Friday 30 October 2026, which the history sees at 16:10.
  expect(cashHistory("2026-10-30T09:05:00Z", "2026-10-30T09:10:00Z")).toEqual({
    points: [],
    end: {
      kind: "notFinal",
      date: "2026-10-30",
      finalAt: new Date("2026-10-30T09:26:00Z"),
    },
  });
});

test("ends at the first final day whose close of the IHSG or of a stock that the portfolio holds is not stored, and names one or several", async () => {
  const wednesday = new Date("2026-11-04T03:00:00Z");
  expect(
    await history({
      now: wednesday,
      stocks: [recordedBbcaForTest(["2026-11-03"])],
    }),
  ).toEqual({
    points: [startPoint, mondayPoint],
    end: { kind: "missingCloses", date: "2026-11-03", codes: ["BBCA"] },
  });
  expect(
    await history({
      now: wednesday,
      market: recordedIhsgForTest(["2026-11-03"]),
      stocks: [recordedBbcaForTest(["2026-11-03"])],
    }),
  ).toEqual({
    points: [startPoint, mondayPoint],
    end: {
      kind: "missingCloses",
      date: "2026-11-03",
      codes: ["IHSG", "BBCA"],
    },
  });
});

test("counts from the latest close of the IHSG before the start when the source left out the close of the start", async () => {
  // The source left out the close of Friday 30 October 2026, so the returns of the IHSG count from its close of Thursday, 5,098.06.
  expect(
    await history({
      now: new Date("2026-11-04T03:00:00Z"),
      market: recordedIhsgForTest(["2026-10-30"]),
    }),
  ).toEqual({
    points: [
      { ...startPoint, date: "2026-10-29" },
      {
        ...mondayPoint,
        market: closeToForTest(-0.0002412682471371463, 15),
      },
      {
        ...tuesdayPoint,
        market: closeToForTest(-0.03800857581119092, 15),
      },
    ],
    end: {
      kind: "notFinal",
      date: "2026-11-04",
      finalAt: new Date("2026-11-04T09:26:00Z"),
    },
  });
});

test("has no return while neither the close of the IHSG on the start nor a later one is stored", () => {
  // A student who joined after session II on Friday 30 October 2026, whose close the history job has not stored on Saturday.
  expect(
    cashHistory(
      "2026-10-30T09:05:00Z",
      "2026-10-31T03:00:00Z",
      recordedIhsgForTest(["2026-10-30", "2026-11-02", "2026-11-03"]),
    ),
  ).toEqual({
    points: [],
    end: { kind: "missingCloses", date: "2026-10-30", codes: ["IHSG"] },
  });
});

test("leaves out a day whose close of the IHSG or of a stock that the portfolio holds the source left out, when a later close is stored", async () => {
  const wednesday = new Date("2026-11-04T03:00:00Z");
  const withoutMonday = {
    points: [startPoint, tuesdayPoint],
    end: {
      kind: "notFinal",
      date: "2026-11-04",
      finalAt: new Date("2026-11-04T09:26:00Z"),
    },
  };
  expect(
    await history({
      now: wednesday,
      market: recordedIhsgForTest(["2026-11-02"]),
    }),
  ).toEqual(withoutMonday);
  expect(
    await history({
      now: wednesday,
      stocks: [recordedBbcaForTest(["2026-11-02"])],
    }),
  ).toEqual(withoutMonday);
});

test("keeps no shares below none when the person who runs the server deleted a filled purchase by hand", async () => {
  const sales = (await tradedOrders()).filter((order) => order.side === "sell");
  expect(sales).toHaveLength(1);
  // Without the purchase, the sale of Tuesday adds Rp48,279,000 to the starting cash and holds no shares.
  expect(
    (await history({ now: new Date("2026-11-04T03:00:00Z"), orders: sales }))
      .points,
  ).toEqual([
    startPoint,
    { ...mondayPoint, portfolio: closeToForTest(0, 15) },
    { ...tuesdayPoint, portfolio: closeToForTest(0.48279, 15) },
  ]);
});

test("ends at a day after which no calendar covers the next trading day", () => {
  // Closes of the IHSG on days that have not come yet, invented for this test. 31 December 2027 is a holiday, and no calendar covers 2028.
  const lateIhsg = indexHistoryForTest(
    buildDailyHistory({ kind: "index", code: "IHSG" }, [
      ["2027-12-29", 5000],
      ["2027-12-30", 5100],
    ]),
  );
  expect(
    cashHistory("2027-12-30T03:00:00Z", "2028-01-05T03:00:00Z", lateIhsg),
  ).toEqual({
    points: [
      {
        date: "2027-12-29",
        portfolio: closeToForTest(0, 15),
        market: closeToForTest(0, 15),
      },
      {
        date: "2027-12-30",
        portfolio: closeToForTest(0, 15),
        market: closeToForTest(0.02, 15),
      },
    ],
    end: { kind: "missingCalendar" },
  });
});

// The IHSG closed at 4,904.29 on Tuesday 3 November 2026, which the history takes as a later level of the index.
const tuesdayIhsgLevel = indexPoints(4_904.29);

test("gives the return of the IHSG at a later level since the close from which the returns of the portfolio count", () => {
  expect(
    marketReturnSinceStart(
      {
        startDate,
        market: recordedIhsgForTest(),
        now: new Date("2026-11-04T03:00:00Z"),
        delayMinutes,
      },
      tuesdayIhsgLevel,
    ),
  ).toEqual(tuesdayPoint.market);
  // Without the close of the start, the return counts from the close before it, as the history does, which the decimal module of Python gives as 4,904.29 / 5,098.06 - 1.
  expect(
    marketReturnSinceStart(
      {
        startDate,
        market: recordedIhsgForTest(["2026-10-30"]),
        now: new Date("2026-11-04T03:00:00Z"),
        delayMinutes,
      },
      tuesdayIhsgLevel,
    ),
  ).toEqual(closeToForTest(-0.03800857581119092, 15));
});

test("gives no return of the IHSG while the prices of the start are not final, or while no close of the IHSG on the start or later is stored", () => {
  const cashStart = successValueForTest(
    historyStartDate(new Date("2026-10-30T09:05:00Z")),
    "IDX calendars cover October 2026",
  );
  expect(
    marketReturnSinceStart(
      {
        startDate: cashStart,
        market: recordedIhsgForTest(),
        now: new Date("2026-10-30T09:10:00Z"),
        delayMinutes,
      },
      tuesdayIhsgLevel,
    ),
  ).toBeUndefined();
  expect(
    marketReturnSinceStart(
      {
        startDate,
        market: recordedIhsgForTest(["2026-10-30", "2026-11-02", "2026-11-03"]),
        now: new Date("2026-11-04T03:00:00Z"),
        delayMinutes,
      },
      tuesdayIhsgLevel,
    ),
  ).toBeUndefined();
});
