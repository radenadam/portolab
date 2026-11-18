import { readHomeDismissedAt } from "~/features/classes/home-dismissal.server";
import { homeSinceOrders } from "~/features/trading/home-since-orders";
import type { Database } from "~/database/database.server";
import type { StoredOrder } from "~/features/trading/order-rows";
import { expect, test, vi } from "vitest";
import { and, eq, gte, lte } from "drizzle-orm";
import { openDatabaseForTest as databaseForTest } from "~/database/open-database-for-test.server";
import { companyOf } from "~/features/market-data/company-of";
import { analysisAllocationRows } from "~/features/measures/analysis-allocation-rows";
import { users, sessions } from "~/features/accounts/accounts.schema";
import { verifyPassword } from "~/features/accounts/password.server";
import { classes, memberships } from "~/features/classes/classes.schema";
import {
  findTaughtClass,
  listStudents,
} from "~/features/classes/class-store.server";
import type { ClassStudent } from "~/features/classes/class-store.server";
import { parseStudentNim } from "~/features/classes/student-nim";
import { defaultStartingCash } from "~/features/classes/class-rules";
import { readClassPortfolios } from "~/features/grading/read-class-portfolios.server";
import {
  holdings,
  orders,
  portfolios,
} from "~/features/trading/trading.schema";
import {
  readPortfolioById,
  readStoredPortfolio,
} from "~/features/trading/portfolio-store.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { placeOrder } from "~/features/trading/place-order";
import {
  applySampleFill,
  checkSampleTrade,
} from "~/features/trading/sample-trades";
import type { AccountState } from "~/features/trading/place-order";
import { hasOpenState } from "~/features/trading/open-orders";
import {
  listStockHistory,
  listIndexHistory,
} from "~/features/market-data/history-store.server";
import type {
  PriceSource,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { fail } from "~/result";
import { rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import {
  samplePriceSourceForTest,
  saveSampleHistoryForTest,
  sampleMomentForTest,
} from "./sample-prices-for-test.server";
import { isSampleClass } from "./is-sample-class.server";
import { watchedCodes } from "~/features/watchlist/watchlist-store.server";
import { seedSampleClass as seedSampleClassWithClock } from "./seed-sample-class.server";
import { buildSamplePortfolio } from "./build-sample-portfolio";
import { readSampleMarket } from "./read-sample-market.server";
import { orderTradingDay } from "~/features/trading/order-trading-day";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { lastContinuousTradingMoment } from "~/features/market-data/idx-calendar";
import { successValueForTest } from "~/success-value-for-test";
import {
  readLatestUpdateAttempt,
  saveUpdateAttempt,
} from "~/features/market-data/update-attempts.server";
import { waitBetweenPriceRequests } from "~/features/market-data/price-request-pacing.server";
import {
  stockDailyCloses,
  indexDailyCloses,
} from "~/features/market-data/market-data.schema";

vi.mock("~/features/market-data/price-request-pacing.server", { spy: true });
vi.mocked(waitBetweenPriceRequests).mockResolvedValue();

const now = sampleMomentForTest;

function seedSampleClass(
  database: Database,
  source: PriceSource,
  moment: Date,
) {
  return seedSampleClassWithClock(database, source, () => moment);
}

test("uses one moment after price preparation when the command crosses midnight", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  const quoteStartedAt = new Date("2026-11-15T16:59:30Z");
  const preparedAt = new Date("2026-11-15T17:01:00Z");
  const moments = [
    new Date("2026-11-15T16:59:00Z"),
    quoteStartedAt,
    preparedAt,
  ];
  const result = await seedSampleClassWithClock(
    database,
    samplePriceSourceForTest,
    () => moments.shift() ?? preparedAt,
  );
  if (!result.ok) throw new Error(result.failure);
  expect(database.select().from(classes).get()?.firstSessionDate).toBe(
    "2026-09-07",
  );
  const waiting = database
    .select()
    .from(orders)
    .all()
    .filter((order) => order.state === "waiting");
  expect(waiting.length).toBeGreaterThan(0);
  for (const order of waiting) expect(order.placedAt).toEqual(preparedAt);
  expect(readLatestUpdateAttempt(database, "quotes")?.attemptedAt).toEqual(
    quoteStartedAt,
  );
});

test("keeps later limit orders after the maximum purchase releases its cash despite a gap in daily closes", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  database
    .delete(stockDailyCloses)
    .where(
      and(
        eq(stockDailyCloses.code, "BBCA"),
        gte(stockDailyCloses.date, "2026-10-30"),
        lte(stockDailyCloses.date, "2026-11-10"),
      ),
    )
    .run();
  expect(
    readSampleMarket(database, {
      from: "2026-09-07",
      until: "2026-11-13",
    }).find((stock) => stock.history.code === "BBCA")?.quotes,
  ).toHaveLength(2);
  saveUpdateAttempt(database, "history", {
    attemptedAt: now,
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes: [],
    finalDate: "2026-11-13",
  });
  expect(readLatestUpdateAttempt(database, "history")?.succeeded).toBe(true);
  const result = await seedSampleClass(database, samplePriceSourceForTest, now);
  if (!result.ok) throw new Error(result.failure);
  const stored = database.select().from(orders).all();
  const rejected = stored.find((order) => order.state === "rejected");
  const cancelled = stored.find((order) => order.state === "cancelled");
  const expired = stored.find((order) => order.state === "expired");
  if (
    rejected?.endedAt === undefined ||
    rejected.endedAt === null ||
    cancelled?.endedAt === undefined ||
    cancelled.endedAt === null ||
    expired === undefined
  )
    throw new Error("The sample has no completed limit sequence.");
  expect(rejected.endedAt.getTime()).toBeLessThan(cancelled.placedAt.getTime());
  expect(cancelled.endedAt.getTime()).toBeLessThan(expired.placedAt.getTime());
});

test("keeps a past holding that left the LQ45 and chooses a current stock for the waiting purchase", () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  const available = readSampleMarket(database, {
    from: "2026-09-07",
    until: "2026-11-13",
  });
  const stocks = ["NCKL", "BBCA"].map((code) => {
    const stock = available.find(
      (candidate) => candidate.history.code === code,
    );
    if (stock === undefined)
      throw new Error(`The fixture has no replayable ${code}.`);
    return stock;
  });
  const currentQuotes = new Map<string, StockQuote>();
  for (const stock of stocks) {
    const quote = stock.quotes.at(-1);
    if (quote === undefined) throw new Error("The fixture has no quote.");
    currentQuotes.set(quote.code, quote);
  }
  const plan = buildSamplePortfolio(
    {
      stocks,
      marketCloses: listIndexHistory(database, "IHSG"),
      startingCash: defaultStartingCash,
      delayMinutes: samplePriceSourceForTest.delayMinutes,
      currentQuotes,
      now: new Date("2026-11-18T03:00:00Z"),
    },
    4,
  );
  expect(plan.ok ? plan.value.at(-1)?.accepted.code : plan.failure).toBe(
    "BBCA",
  );
  expect(
    plan.ok &&
      plan.value.some(
        (trade) =>
          trade.accepted.code === "NCKL" && trade.state.kind === "filled",
      ),
  ).toBe(true);
  expect(plan.ok && plan.value.at(-1)?.state.kind).toBe("waiting");
});

test("checks current waiting orders at the quote while past fills keep their stored closes", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  database
    .delete(stockDailyCloses)
    .where(eq(stockDailyCloses.date, "2026-11-13"))
    .run();
  database
    .delete(indexDailyCloses)
    .where(eq(indexDailyCloses.date, "2026-11-13"))
    .run();
  expect(listStockHistory(database, "BBCA").closes.at(-1)?.close).toBe(5_475);
  const result = await seedSampleClass(
    database,
    samplePriceSourceForTest,
    new Date("2026-11-13T09:04:00Z"),
  );
  expect(result.ok ? "seeded" : result.failure).toBe("seeded");
  const waiting = database
    .select()
    .from(orders)
    .all()
    .find((order) => order.code === "BBCA" && order.state === "waiting");
  expect(waiting?.checkedPrice).toBe(rupiah(5_500));
  for (const order of database
    .select()
    .from(orders)
    .all()
    .filter((order) => order.state === "filled")) {
    expect(
      order.quotedAt === null
        ? "missing"
        : wibDateOf(order.quotedAt) <= "2026-11-12",
    ).toBe(true);
  }
});

test("runs the history update when a required stock lacks months despite enough other measured stocks", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  database
    .delete(stockDailyCloses)
    .where(eq(stockDailyCloses.code, "BMRI"))
    .run();
  expect(
    readSampleMarket(database, { from: "2026-09-07", until: "2026-11-13" })
      .length,
  ).toBeGreaterThanOrEqual(10);
  expect(listStockHistory(database, "BMRI").closes).toEqual([]);
  const result = await seedSampleClass(database, samplePriceSourceForTest, now);
  expect(result.ok ? "seeded" : result.failure).toBe("seeded");
  expect(listStockHistory(database, "BMRI").closes.length).toBeGreaterThan(24);
});

test("sizes a current order when one recorded lot costs more than a small allocation", () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  const stocks = readSampleMarket(database, {
    from: "2026-09-07",
    until: "2026-11-13",
  }).filter((stock) => stock.history.code === "UNTR");
  expect(stocks).toHaveLength(1);
  const quote = stocks[0]?.quotes.at(-1);
  if (quote === undefined)
    throw new Error("The high-priced fixture has no quote.");
  const day = orderTradingDay(
    quote.quotedAt,
    samplePriceSourceForTest.delayMinutes,
  );
  if (!day.ok) throw new Error(JSON.stringify(day.failure));
  expect(rupiah(quote.price * day.value.rules.lotShares)).toBeGreaterThan(
    rupiah(1_000_000),
  );
  const plan = buildSamplePortfolio(
    {
      stocks,
      marketCloses: listIndexHistory(database, "IHSG"),
      startingCash: defaultStartingCash,
      delayMinutes: samplePriceSourceForTest.delayMinutes,
      now,
      currentQuotes: new Map([[quote.code, quote]]),
    },
    4,
  );
  expect(plan.ok ? plan.value.at(-1)?.state.kind : plan.failure).toBe(
    "waiting",
  );
});

test("stars two stocks for every sample person but the empty student", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  const result = await seedSampleClass(database, samplePriceSourceForTest, now);
  if (!result.ok) throw new Error(result.failure);
  const people = database.select().from(users).all();
  expect(people).toHaveLength(31);
  for (const person of people) {
    expect(watchedCodes(database, person.id)).toEqual(
      person.username === "contoh-30" ? [] : ["BBCA", "TLKM"],
    );
  }
});

test("seeds a separate class with credentials, every terminal order state, current open orders, measured portfolios, and a reason of its own for each order", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  expect(database.select().from(users).all()).toEqual([]);
  const result = await seedSampleClass(database, samplePriceSourceForTest, now);
  expect(result.ok ? result.value.split("\n").length : result.failure).toBe(33);
  if (!result.ok) throw new Error(result.failure);
  expect(isSampleClass(database)).toBe(true);
  expect(findStockQuote(database, "BBCA")?.dayRange).toEqual({
    low: 5425,
    high: 5650,
  });
  const people = database.select().from(users).all();
  expect(people).toHaveLength(31);
  const lecturer = people.find((person) => person.role === "lecturer");
  const taught = database.select().from(classes).get();
  if (lecturer === undefined || taught === undefined)
    throw new Error("The sample has no taught class.");
  expect(taught.firstSessionDate).toBe("2026-09-07");
  expect(result.value).toContain(`Join code: ${taught.joinCode}`);
  await checkPrintedCredentials(result.value, people);
  const states = new Set(
    database
      .select()
      .from(orders)
      .all()
      .map((order) => order.state),
  );
  expect([...states].sort()).toEqual([
    "cancelled",
    "expired",
    "filled",
    "rejected",
    "waiting",
  ]);
  const sampleOrders = database.select().from(orders).all();
  expect(
    sampleOrders.filter((order) => order.reason !== null).length /
      sampleOrders.length,
  ).toBeGreaterThan(0.8);
  const reasons = sampleOrders.flatMap((order) =>
    order.reason === null ? [] : [order.reason],
  );
  expect(new Set(reasons).size).toBe(reasons.length);
  expect(reasons.some((reason) => reason.includes("\n\n"))).toBe(true);
  for (const order of sampleOrders.filter((order) => order.state === "waiting"))
    expect(wibDateOf(order.placedAt)).toBe(wibDateOf(now));
  const record = findTaughtClass(database, taught.id, lecturer.id);
  if (record === undefined)
    throw new Error("The sample class has no lecturer record.");
  const ranked = readClassPortfolios(database, record, {
    request: new Request("http://localhost/"),
    now,
    delayMinutes: samplePriceSourceForTest.delayMinutes,
  });
  expect(ranked.ranked.length).toBeGreaterThanOrEqual(27);
  expect(ranked.unmeasured.some((student) => !student.hasHoldings)).toBe(true);
  expect(ranked.ranked.some((student) => student.activeThisWeek)).toBe(true);
  expect(ranked.ranked.some((student) => !student.activeThisWeek)).toBe(true);
  expect(
    ranked.ranked.some(
      (student) =>
        student.total !== undefined &&
        student.marketReturn !== undefined &&
        student.total.return < student.marketReturn,
    ),
  ).toBe(true);
  expect(
    ranked.ranked.some(
      (student) =>
        student.total !== undefined &&
        student.marketReturn !== undefined &&
        student.total.return > student.marketReturn,
    ),
  ).toBe(true);
  expect(
    new Set(ranked.ranked.map((student) => student.measures.beta)).size,
  ).toBeGreaterThan(15);
  const students = listStudents(database, taught.id);
  expect(students).toHaveLength(30);
  expect(new Set(students.map((student) => student.nim))).toEqual(
    new Set(
      Array.from(
        { length: students.length },
        (_unused, index) => `CONTOH-${String(index + 1)}`,
      ),
    ),
  );
  for (const student of students) {
    expect(parseStudentNim(student.nim, "NIM")).toEqual({
      ok: true,
      value: student.nim,
    });
  }
  const firstStudent = students[0];
  if (firstStudent === undefined) throw new Error("The sample has no student.");
  const firstPortfolio = database
    .select()
    .from(portfolios)
    .where(eq(portfolios.membershipId, firstStudent.membershipId))
    .get();
  // Python Decimal gives purchase costs of 12,967,422, 12,991,458, 12,759,110, 12,881,794, and 12,969,425 rupiah at the recorded closes of 2 to 6 November. These leave 35,430,791 from the starting 100,000,000.
  expect(firstPortfolio?.cash).toBe(rupiah(35_430_791));
  checkSampleAnalysis(database, firstPortfolio);
  checkSampleAnalysis(
    database,
    database
      .select()
      .from(portfolios)
      .where(eq(portfolios.demonstrationClassId, taught.id))
      .get(),
  );
  expectSampleLessons(database, firstPortfolio);
  expectSampleHomeSummary(database, firstStudent, now);
  const empty = students.at(-1);
  if (empty === undefined)
    throw new Error("The empty sample student is missing.");
  expect(readHomeDismissedAt(database, empty.membershipId)).toBeUndefined();
  expect(
    database
      .select()
      .from(portfolios)
      .where(eq(portfolios.demonstrationClassId, taught.id))
      .get(),
  ).toBeDefined();
  expect(
    (await seedSampleClass(database, samplePriceSourceForTest, now)).ok,
  ).toBe(false);
});

function expectSampleHomeSummary(
  database: Database,
  student: Pick<ClassStudent, "membershipId" | "joinedAt">,
  now: Date,
): void {
  const dismissedAt = readHomeDismissedAt(database, student.membershipId);
  expect(dismissedAt).toEqual(student.joinedAt);
  const stored = readStoredPortfolio(database, {
    kind: "membership",
    membershipId: student.membershipId,
    startingCash: defaultStartingCash,
  });
  if (stored === undefined)
    throw new Error("The first sample student has no portfolio.");
  const since = homeSinceOrders(stored.orders, dismissedAt, now);
  expect(new Set(since.map((order) => order.state.kind))).toEqual(
    new Set(["filled", "expired", "rejected"]),
  );
}

test("replays each stored order through placement and fill checks at its stored daily close", async () => {
  const database = databaseForTest();
  saveSampleHistoryForTest(database);
  const seeded = await seedSampleClass(database, samplePriceSourceForTest, now);
  if (!seeded.ok) throw new Error(seeded.failure);
  for (const portfolio of database.select().from(portfolios).all()) {
    const stored = readPortfolioById(database, portfolio.id);
    if (stored === undefined)
      throw new Error("The sample portfolio disappeared.");
    let account: AccountState = {
      cash: defaultStartingCash,
      holdings: [],
      orders: [],
    };
    for (const order of stored.orders) {
      account = replayOrder(database, account, order);
    }
    expect(account.cash).toBe(stored.cash);
    expect(
      account.holdings.toSorted((first, second) =>
        first.code.localeCompare(second.code),
      ),
    ).toEqual(stored.holdings);
  }
});

test.each([
  "users",
  "sessions",
  "classes",
  "memberships",
  "portfolios",
  "holdings",
  "orders",
])(
  "refuses existing records in %s before contacting the source",
  async (table) => {
    const database = databaseForTest();
    saveSampleHistoryForTest(database);
    const seeded = await seedSampleClass(
      database,
      samplePriceSourceForTest,
      now,
    );
    if (!seeded.ok) throw new Error(seeded.failure);
    const user = database.select().from(users).get();
    if (user === undefined) throw new Error("The sample has no account.");
    database
      .insert(sessions)
      .values({
        id: "sample-session",
        secretHash: Buffer.alloc(32),
        userId: user.id,
        lastUsedAt: now,
      })
      .run();
    database.$client.pragma("foreign_keys = OFF");
    for (const name of [
      "watchlist",
      "sessions",
      "holdings",
      "orders",
      "portfolios",
      "memberships",
      "classes",
      "users",
      "sample_class_marker",
    ]) {
      if (name !== table) database.$client.exec(`DELETE FROM ${name}`);
    }
    const counts = {
      users: users,
      sessions,
      classes,
      memberships,
      portfolios,
      holdings,
      orders,
    };
    const selected = counts[table as keyof typeof counts];
    expect(database.select().from(selected).all().length).toBeGreaterThan(0);
    const fetch = vi.fn<PriceSource["fetchDailyHistory"]>();
    const result = await seedSampleClass(
      database,
      { ...samplePriceSourceForTest, fetchDailyHistory: fetch },
      now,
    );
    expect(result.ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  },
);

const failureStages = ["history", "quotes"] as const;
type FailureStage = (typeof failureStages)[number];
const stageNames: Record<FailureStage, string> = {
  history: "history",
  quotes: "quote",
};
for (const stage of failureStages) {
  test(`leaves no people or marker when the ${stageNames[stage]} update supplies no usable data`, async () => {
    const database = databaseForTest();
    if (stage === "quotes") {
      saveSampleHistoryForTest(database);
      expect(
        readSampleMarket(database, { from: "2026-09-07", until: "2026-11-13" })
          .length,
      ).toBeGreaterThanOrEqual(10);
    }
    const unavailable = () =>
      Promise.resolve(fail("The test source is unavailable."));
    const sources: Record<FailureStage, PriceSource> = {
      history: { ...samplePriceSourceForTest, fetchDailyHistory: unavailable },
      quotes: { ...samplePriceSourceForTest, fetchQuotes: unavailable },
    };
    const result = await seedSampleClass(database, sources[stage], now);
    expect(result.ok).toBe(false);
    expect(database.select().from(users).all()).toEqual([]);
    expect(isSampleClass(database)).toBe(false);
  });
}

function replayOrder(
  database: Database,
  account: AccountState,
  order: StoredOrder,
): AccountState {
  const closes = listStockHistory(database, order.code);
  const marketCloses = listIndexHistory(database, "IHSG");
  const day = wibDateOf(order.placedAt);
  const availableCloses = closes.closes.filter((close) => close.date <= day);
  const checkedClose = availableCloses.at(-1);
  const previousClose = availableCloses.at(-2);
  if (checkedClose === undefined || previousClose === undefined)
    throw new Error("The sample order has no stored quote.");
  const quote: StockQuote = {
    kind: "stock",
    code: order.code,
    price: rupiah(checkedClose.close),
    previousClose: rupiah(previousClose.close),
    quotedAt: successValueForTest(
      lastContinuousTradingMoment(checkedClose.date),
      "The stored quote has a recorded trading session",
    ),
  };
  const placed = placeOrder(order, account, {
    quote,
    delayMinutes: samplePriceSourceForTest.delayMinutes,
    closes: { ...closes, closes: availableCloses },
    marketCloses: {
      ...marketCloses,
      closes: marketCloses.closes.filter((close) => close.date <= day),
    },
  });
  expect(placed.ok ? placed.value.checkedPrice : placed.failure).toBe(
    order.checkedPrice,
  );
  if (!placed.ok) throw new Error(JSON.stringify(placed.failure));
  if (order.state.kind === "filled" || order.state.kind === "rejected") {
    const state = order.state;
    const quotedAt =
      state.kind === "filled" ? state.fill.quotedAt : state.quotedAt;
    const close = closes.closes.find(
      (candidate) => candidate.date === wibDateOf(quotedAt),
    );
    if (close === undefined) throw new Error("The fill has no stored close.");
    const checked = checkSampleTrade(
      { accepted: placed.value, state: placed.value.state },
      account,
      {
        quote: { ...quote, price: rupiah(close.close), quotedAt },
        now: state.kind === "filled" ? state.fill.filledAt : state.rejectedAt,
      },
    );
    expect(checked.state).toEqual(order.state);
  }
  if (!hasOpenState(placed.value))
    throw new Error("The accepted order is already closed.");
  return applySampleFill(account, {
    accepted: placed.value,
    state: order.state,
  });
}

async function checkPrintedCredentials(
  output: string,
  people: (typeof users.$inferSelect)[],
): Promise<void> {
  const checkedHashes = new Set<string>();
  for (const line of output.split("\n").slice(2)) {
    const [role, username, password] = line.split(" | ");
    const person = people.find((candidate) => candidate.username === username);
    if (person === undefined || password === undefined)
      throw new Error("The sample printed no matching account.");
    expect(person.role).toBe(role);
    expect(person.mustChangePassword).toBe(false);
    if (!checkedHashes.has(person.passwordHash)) {
      expect(await verifyPassword(password, person.passwordHash)).toBe(true);
      checkedHashes.add(person.passwordHash);
    }
  }
}

function readSampleMeasures(
  database: Database,
  sample: typeof portfolios.$inferSelect | undefined,
) {
  if (sample === undefined)
    throw new Error("The sample has no such portfolio.");
  const stored = readPortfolioById(database, sample.id);
  if (stored === undefined)
    throw new Error("The sample portfolio disappeared.");
  const { valuation } = readPortfolioValuation(database, {
    portfolio: stored,
    startingCash: defaultStartingCash,
  });
  const report = readPortfolioMeasures(database, valuation);
  if (report.kind !== "measured" || !report.measures.ok)
    throw new Error("The sample portfolio needs measures.");
  return { stored, valuation, portfolio: report.measures.value };
}

function checkSampleAnalysis(
  database: Database,
  sample: typeof portfolios.$inferSelect | undefined,
): void {
  const { valuation, portfolio } = readSampleMeasures(database, sample);
  expect(portfolio.holdings.length).toBeGreaterThan(1);
  expect(portfolio.cash.weight).toBeGreaterThan(0);
  expect(
    new Set(portfolio.holdings.map(({ code }) => companyOf(code).sector)).size,
  ).toBeGreaterThan(1);
  expect(portfolio.pairs.some(({ first, second }) => first !== second)).toBe(
    true,
  );
  expect(
    portfolio.holdingRisks.ok &&
      portfolio.holdingRisks.value.length === portfolio.holdings.length,
  ).toBe(true);
  const allocation = analysisAllocationRows(valuation, "sector");
  expect(allocation.kind === "valued" && allocation.rows.at(-1)?.key).toBe(
    "cash",
  );
}

function expectSampleLessons(
  database: Database,
  firstPortfolio: typeof portfolios.$inferSelect | undefined,
): void {
  const { stored, portfolio } = readSampleMeasures(database, firstPortfolio);
  const lessonPairs = portfolio.pairs.filter(
    (pair) => pair.first !== pair.second,
  );
  expect(lessonPairs.length).toBeGreaterThan(1);
  expect(
    new Set(lessonPairs.map((pair) => pair.correlation)).size,
  ).toBeGreaterThan(1);
  expect(stored.orders.some((order) => order.state.kind === "filled")).toBe(
    true,
  );
}
