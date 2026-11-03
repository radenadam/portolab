import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createTestStudent } from "~/features/accounts/accounts-for-test.server";
import { createLecturerWithClassForTest } from "~/features/classes/classes-for-test.server";
import {
  findJoinedClass,
  joinClass,
} from "~/features/classes/class-store.server";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import type { Quote } from "~/features/market-data/price-source.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { successValueForTest } from "~/success-value-for-test";
import type { OrderRequest } from "./order";
import { bbcaForTest, duringSessionForTest } from "./orders-for-test";
import { placePortfolioOrder } from "./place-portfolio-order.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import type { OrderId } from "./trading.schema";

/** Creates a student who joined the class of the test, which has the default starting cash, at 10:00 WIB on Monday 2 November 2026, and returns the portfolio of the student, which holds that cash and nothing else. A test that needs a second student gives another username. */
export async function studentPortfolioForTest(
  database: Database,
  username = "mahasiswa",
): Promise<PortfolioOwner> {
  const { classId } = await classOfTest(database);
  const studentId = await createTestStudent(database, username, "Siti Rahayu");
  joinClass(database, { classId, studentId }, duringSessionForTest);
  const joined = findJoinedClass(database, classId, studentId);
  if (joined === undefined) {
    throw new Error(`The test could not add ${username} to its class.`);
  }
  return {
    membershipId: joined.membershipId,
    startingCash: joined.startingCash,
  };
}

/** Stores the month-end closes of the IHSG and of BBCA, which give BBCA the monthly returns that a purchase needs. */
export function storeBbcaHistoryForTest(database: Database): void {
  saveDailyHistory(database, monthEndClosesForTest("IHSG"));
  saveDailyHistory(database, monthEndClosesForTest("BBCA"));
}

/** Opens a database for a test with the month-end closes of BBCA and the IHSG and with a student of a class, and fetches the quotes of the test at a moment, as an update of the price job does. Returns the database and the portfolio of the student. */
export async function studentWithQuotesForTest(
  quotes: readonly Quote[],
  fetchedAt: Date,
): Promise<{ database: Database; owner: PortfolioOwner }> {
  const database = openDatabaseForTest();
  storeBbcaHistoryForTest(database);
  const owner = await studentPortfolioForTest(database);
  await updateQuotesForTest(database, sourceAnsweringForTest(quotes), {
    at: fetchedAt,
  });
  return { database, owner };
}

/** Places an order that the test knows Portolab accepts, with the delay of the source of the tests of orders, and returns its number. */
export function placedOrderForTest(
  database: Database,
  owner: PortfolioOwner,
  request: OrderRequest,
): OrderId {
  return successValueForTest(
    placePortfolioOrder(database, request, {
      owner,
      delayMinutes: bbcaForTest.delayMinutes,
    }),
    "Portolab accepts the order",
  );
}

// The students of a test join one class, so its lecturer and the class are created with the first student of each database.
const classesOfDatabases = new WeakMap<
  Database,
  ReturnType<typeof createLecturerWithClassForTest>
>();

function classOfTest(
  database: Database,
): ReturnType<typeof createLecturerWithClassForTest> {
  const existing = classesOfDatabases.get(database);
  if (existing !== undefined) {
    return existing;
  }
  const created = createLecturerWithClassForTest(database);
  classesOfDatabases.set(database, created);
  return created;
}
