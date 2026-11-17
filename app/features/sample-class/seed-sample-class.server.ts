import type { Database } from "~/database/database.server";
import {
  hasAccountRecords,
  prepareSampleAccounts,
  saveSampleAccounts,
} from "~/features/accounts/sample-accounts.server";
import {
  createClass,
  findClassStudent,
  findTaughtClass,
  hasClassRecords,
  joinClass,
} from "~/features/classes/class-store.server";
import { defaultStartingCash } from "~/features/classes/class-rules";
import { listIndexHistory } from "~/features/market-data/history-store.server";
import { latestClosedTradingDay } from "~/features/market-data/idx-calendar";
import type {
  PriceSource,
  StockQuote,
} from "~/features/market-data/price-source.server";
import {
  trackedInstruments,
  marketIndex,
} from "~/features/market-data/tracked-instruments";
import { runHistoryUpdate } from "~/features/market-data/run-history-update.server";
import { runQuoteUpdate } from "~/features/market-data/price-job.server";
import {
  findIndexQuote,
  findStockQuote,
} from "~/features/market-data/quote-store.server";
import {
  priceRequestSignal,
  waitBetweenPriceRequests,
} from "~/features/market-data/price-request-pacing.server";
import {
  defaultEstimationSettings,
  earliestCloseDate,
} from "~/features/measures/estimation-settings";
import { hasPortfolioRecords } from "~/features/trading/portfolio-store.server";
import { saveSamplePortfolio } from "~/features/trading/save-sample-portfolio.server";
import { addDays } from "~/calendar-dates";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { wibDateOf, wibMoment } from "~/wib";
import { minuteMilliseconds } from "~/time-units";
import { buildSamplePortfolio } from "./build-sample-portfolio";
import type { SampleTrade } from "~/features/trading/sample-trades";
import { readSampleMarket } from "./read-sample-market.server";
import { sampleClassMarker } from "./sample-class-marker.schema";
import { isSampleClass } from "./is-sample-class.server";
import {
  sampleCoreStocks,
  sampleConcentratedSectors,
} from "./sample-portfolio-recipes";
import type { SampleStock } from "./read-sample-market.server";
import { setWatched } from "~/features/watchlist/watchlist-store.server";

function occupied(database: Database): boolean {
  return (
    hasAccountRecords(database) ||
    hasClassRecords(database) ||
    hasPortfolioRecords(database) ||
    isSampleClass(database)
  );
}

const occupiedFailure =
  "The sample command refuses a database that holds accounts, classes, portfolios, or a sample marker. Set DATABASE_PATH to a fresh database file and run it again.";
const minimumSampleStocks = 10;
const minimumCoreTradingDays = 3;
const sampleClassAgeDays = 70;

function marketProblems(stocks: readonly SampleStock[]): string[] {
  const problems: string[] = [];
  if (stocks.length < minimumSampleStocks)
    problems.push(
      `The sample class needs at least ${String(minimumSampleStocks)} measured stocks with replayable trading days, but it found ${String(stocks.length)}.`,
    );
  const missingCodes = sampleCoreStocks.filter(
    (code) => !stocks.some((stock) => stock.history.code === code),
  );
  if (missingCodes.length > 0)
    problems.push(
      `The core sample portfolio needs replayable closes and monthly returns of ${missingCodes.join(", ")}.`,
    );
  const shortHistories = sampleCoreStocks.filter((code) => {
    const stock = stocks.find((candidate) => candidate.history.code === code);
    return stock !== undefined && stock.quotes.length < minimumCoreTradingDays;
  });
  if (shortHistories.length > 0)
    problems.push(
      `The core sample recipe needs at least ${String(minimumCoreTradingDays)} replayable trading days for ${shortHistories.join(", ")}.`,
    );
  const missingSectors = sampleConcentratedSectors.filter(
    (sector) => !stocks.some((stock) => stock.sector === sector),
  );
  if (missingSectors.length > 0)
    problems.push(
      `The sample styles need measured stocks in these sectors: ${missingSectors.join(", ")}.`,
    );
  return problems;
}

/** Preparing everything before writing people lets the operator retry after a source failure without finding half a class. */
export async function seedSampleClass(
  database: Database,
  source: PriceSource,
  clock: () => Date,
): Promise<Result<string, string>> {
  if (occupied(database)) return fail(occupiedFailure);
  const startedAt = clock();
  const requestedFirstSessionDate = addDays(
    wibDateOf(startedAt),
    -sampleClassAgeDays,
  );
  const requestedFinalDay = latestClosedTradingDay(
    startedAt,
    source.delayMinutes,
  );
  if (!requestedFinalDay.ok) return requestedFinalDay;
  const settings = {
    database,
    priceSource: source,
    instruments: trackedInstruments,
    historyStartDate: earliestCloseDate(
      defaultEstimationSettings,
      requestedFirstSessionDate,
    ),
  };
  let stocks = readSampleMarket(database, {
    from: requestedFirstSessionDate,
    until: requestedFinalDay.value,
  });
  if (marketProblems(stocks).length > 0) {
    await runHistoryUpdate({ ...settings, refreshStoredHistory: true }, clock, {
      requestSignal: priceRequestSignal,
      waitBetweenRequests: waitBetweenPriceRequests,
    });
    stocks = readSampleMarket(database, {
      from: requestedFirstSessionDate,
      until: requestedFinalDay.value,
    });
  }
  const problems = marketProblems(stocks);
  if (problems.length > 0)
    return fail(
      `${problems.join(" ")} Check the history update failures and run the command again.`,
    );
  await runQuoteUpdate(settings, clock(), priceRequestSignal());
  const now = clock();
  const firstSessionDate = addDays(wibDateOf(now), -sampleClassAgeDays);
  const createdAt = wibMoment(firstSessionDate, 0);
  const finalDay = latestClosedTradingDay(now, source.delayMinutes);
  if (!finalDay.ok) return finalDay;
  stocks = readSampleMarket(database, {
    from: firstSessionDate,
    until: finalDay.value,
  });
  const currentQuotes = new Map<string, StockQuote>();
  stocks = stocks.filter((stock) => {
    const quote = findStockQuote(database, stock.history.code);
    if (quote === undefined) return false;
    currentQuotes.set(quote.code, quote);
    return true;
  });
  const quoteProblems = marketProblems(stocks);
  if (findIndexQuote(database, marketIndex.code) === undefined)
    quoteProblems.push(
      `The sample class needs a stored ${marketIndex.code} quote for its benchmark.`,
    );
  if (quoteProblems.length > 0)
    return fail(
      `${quoteProblems.join(" ")} Check the quote update failures and run the command again.`,
    );
  const accounts = await prepareSampleAccounts(createdAt);
  const plans: SampleTrade[][] = [];
  const recipe = {
    stocks,
    marketCloses: listIndexHistory(database, marketIndex.code),
    startingCash: defaultStartingCash,
    delayMinutes: source.delayMinutes,
    now,
    currentQuotes,
  };
  for (const [index] of accounts.entries()) {
    const plan =
      index === accounts.length - 1
        ? succeed([])
        : buildSamplePortfolio(recipe, index === 0 ? 33 : index - 1);
    if (!plan.ok) return plan;
    plans.push(plan.value);
  }
  // A second operator can create an account while history or hashes are being prepared.
  return database.transaction(() => {
    if (occupied(database)) return fail(occupiedFailure);
    const people = saveSampleAccounts(database, accounts);
    const lecturer = people[0];
    if (lecturer === undefined) throw new Error("The sample has no lecturer.");
    const classId = createClass(
      database,
      {
        lecturerId: lecturer.id,
        name: "Manajemen Portofolio Contoh",
        startingCash: defaultStartingCash,
        firstSessionDate,
      },
      createdAt,
    );
    for (const [index, person] of people.entries()) {
      if (index < people.length - 1) {
        for (const code of sampleCoreStocks.slice(0, 2))
          setWatched(database, { userId: person.id, code, watched: true }, now);
      }
      const plan = plans[index];
      if (plan === undefined)
        throw new Error("A sample person has no portfolio recipe.");
      if (index === 0)
        saveSamplePortfolio(
          database,
          { kind: "demonstration", classId, startingCash: defaultStartingCash },
          plan,
        );
      else {
        const firstOrder = plan[0];
        const joinedAt =
          firstOrder === undefined
            ? now
            : new Date(
                firstOrder.accepted.placedAt.getTime() - minuteMilliseconds,
              );
        joinClass(database, { classId, studentId: person.id }, joinedAt);
        const membership = findClassStudent(database, classId, person.id);
        if (membership === undefined)
          throw new Error("The sample student did not join the class.");
        saveSamplePortfolio(
          database,
          {
            kind: "membership",
            membershipId: membership.membershipId,
            startingCash: defaultStartingCash,
          },
          plan,
        );
      }
    }
    database.insert(sampleClassMarker).values({ id: 1 }).run();
    const taught = findTaughtClass(database, classId, lecturer.id);
    if (taught === undefined)
      throw new Error("The sample lecturer has no class.");
    return succeed(
      [
        `Sample class: ${taught.name}`,
        `Join code: ${taught.joinCode}`,
        ...people.map(
          (person) =>
            `${person.role} | ${person.username} | ${person.password}`,
        ),
      ].join("\n"),
    );
  });
}
