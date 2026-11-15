import express from "express";
import type { RequestHandler } from "express";
import type { Database } from "../app/database/database.server.ts";
import type { PriceSource } from "../app/features/market-data/price-source.server.ts";
import {
  holdings,
  orders,
  portfolios,
} from "../app/features/trading/trading.schema.ts";
import { isOrderLots } from "../app/units/lots.ts";
import { shares } from "../app/units/shares.ts";
import { fail } from "../app/result.ts";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import {
  createLecturer,
  findAccountByUsername,
  updateAccount,
} from "../app/features/accounts/account-store.server.ts";
import { parseUsername } from "../app/features/accounts/username.ts";
import {
  createClass,
  findJoinedClass,
} from "../app/features/classes/class-store.server.ts";
import {
  saveDailyHistory,
  listStockHistory,
} from "../app/features/market-data/history-store.server.ts";
import { saveQuotes } from "../app/features/market-data/quote-store.server.ts";
import { saveFixtureHistoryForTest } from "../app/features/market-data/save-fixture-history-for-test.server.ts";
import { stockQuote } from "../app/features/market-data/stock-quote.ts";
import { buildDailyHistory } from "../app/features/market-data/build-daily-history.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { indexPoints } from "../app/units/index-points.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { chosenPassword } from "./accounts.ts";
import { createClassStudent } from "./create-class-student.ts";

/** An isolated server keeps the shared browser fixture unchanged while exercising quotes newer than its closes. */
export async function returnSnapshotServer() {
  const root = join(import.meta.dirname, "..");
  const database = openDatabase(":memory:", join(root, migrationsFolderName));
  try {
    saveFixtureHistoryForTest(database, ["IHSG", "BBCA"]);
    // These closes are recorded in traded-portfolio-for-test.server.ts. Its recorded Tuesday close also serves as an intraday quote, so no invented real stock price enters the fixture.
    saveDailyHistory(
      database,
      buildDailyHistory({ kind: "index", code: "IHSG" }, [
        ["2026-11-02", 5096.83],
      ]),
    );
    saveDailyHistory(
      database,
      buildDailyHistory({ kind: "stock", code: "BBCA" }, [
        ["2026-11-02", 4980],
      ]),
    );
    const joinedAt = new Date("2026-11-02T03:00:00Z");
    const startingCash = rupiah(100_000_000);
    const lecturerUsername = successValueForTest(
      parseUsername("dosen", "The lecturer username"),
      "The lecturer username is valid",
    );
    await createLecturer(database, lecturerUsername);
    const lecturer = findAccountByUsername(database, lecturerUsername);
    if (lecturer === undefined) throw new Error("The fixture lecturer exists.");
    await updateAccount(database, lecturer.id, {
      name: "Dosen",
      password: chosenPassword,
      consentedAt: joinedAt,
    });
    const classId = createClass(
      database,
      {
        lecturerId: lecturer.id,
        name: "Manajemen Portofolio A",
        startingCash,
        firstSessionDate: "2026-10-26",
      },
      joinedAt,
    );
    const student = await createClassStudent(database, classId, {
      name: "Mahasiswa",
      now: joinedAt,
    });
    const joined = findJoinedClass(database, classId, student.studentId);
    if (joined === undefined)
      throw new Error("The fixture student belongs to its class.");
    saveQuotes(
      database,
      [stockQuote("BBCA", [4980, 4980], "2026-11-02T02:50:00Z")],
      joinedAt,
    );
    const lots = 200;
    if (!isOrderLots(lots))
      throw new Error("The fixture purchase has a valid number of lots.");
    for (const owner of [
      { membershipId: joined.membershipId },
      { demonstrationClassId: classId },
    ]) {
      const portfolio = database
        .insert(portfolios)
        .values({ ...owner, cash: rupiah(250_600) })
        .returning({ id: portfolios.id })
        .get();
      database
        .insert(holdings)
        .values({
          portfolioId: portfolio.id,
          code: "BBCA",
          shares: shares(20_000),
          cost: rupiah(99_749_400),
        })
        .run();
      database
        .insert(orders)
        .values({
          portfolioId: portfolio.id,
          code: "BBCA",
          side: "buy",
          lots,
          limit: null,
          reason: null,
          placedAt: joinedAt,
          shares: shares(20_000),
          tradingDay: "2026-11-02",
          tradesFrom: new Date("2026-11-02T02:00:00Z"),
          expiresAt: new Date("2026-11-02T09:26:00Z"),
          checkedPrice: rupiah(4980),
          setAsideCash: rupiah(99_749_400),
          state: "filled",
          endedAt: joinedAt,
          quotedAt: new Date("2026-11-02T02:50:00Z"),
          tradePrice: rupiah(4980),
          tradeValue: rupiah(99_600_000),
          tradeFee: rupiah(149_400),
          tradeTax: rupiah(0),
        })
        .run();
    }
    const measuredAt = new Date("2026-11-03T03:00:00Z");
    saveQuotes(
      database,
      [
        stockQuote("BBCA", [4840, 4980], measuredAt.toISOString()),
        {
          kind: "index",
          code: "IHSG",
          level: indexPoints(4904.29),
          previousLevel: indexPoints(5096.83),
          quotedAt: measuredAt,
        },
      ],
      measuredAt,
    );
    // The build is this repository's own server code, so this assertion does not parse outside input.
    const build = (await import(
      pathToFileURL(join(root, "build/server/index.js")).href
    )) as {
      createApp: (services: unknown) => RequestHandler;
      createRequestServices: (
        database: Database,
        priceSource: PriceSource,
        stop: () => void,
      ) => unknown;
    };
    const app = express();
    app.disable("x-powered-by");
    app.use(express.static(join(root, "build/client")));
    app.use(
      build.createApp(
        build.createRequestServices(
          database,
          {
            name: "Recorded quotes",
            delayMinutes: 10,
            fetchQuotes: () =>
              Promise.resolve(
                fail("The snapshot server keeps its recorded quotes."),
              ),
            fetchDailyHistory: () =>
              Promise.resolve(
                fail("The snapshot server keeps its recorded closes."),
              ),
          },
          () => undefined,
        ),
      ),
    );
    const listener = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      listener.once("listening", resolve);
      listener.once("error", reject);
    });
    const address = listener.address();
    if (address === null || typeof address === "string")
      throw new Error("The test server listens on a TCP port.");
    return {
      url: `http://127.0.0.1:${String(address.port)}`,
      classPath: `/classes/${String(classId)}`,
      lecturerUsername,
      studentUsername: student.username,
      latestClose: listStockHistory(database, "BBCA").closes.at(-1)?.date,
      measuredAt,
      stop: async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            listener.close((error) => {
              if (error === undefined) resolve();
              else reject(error);
            });
            listener.closeAllConnections();
          });
        } finally {
          closeDatabase(database);
        }
      },
    };
  } catch (error) {
    closeDatabase(database);
    throw error;
  }
}
