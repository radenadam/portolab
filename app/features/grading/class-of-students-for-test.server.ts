import type { Database } from "~/database/database.server";
import { createTestStudent } from "~/features/accounts/accounts-for-test.server";
import {
  findJoinedClass,
  findTaughtClass,
  joinClass,
} from "~/features/classes/class-store.server";
import { createLecturerWithClassForTest } from "~/features/classes/classes-for-test.server";
import type { TaughtClassDetails } from "~/features/classes/taught-class.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { databaseWithClosesForTest } from "~/features/measures/measures-for-test.server";
import type { Holding } from "~/features/trading/holding-after-fill";
import { storeHoldingsForTest } from "~/features/trading/portfolios-for-test.server";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";

// The quotes of 30 October 2026 that the fixture source records, as measures-for-test.server.ts takes them. The class has the default starting cash of Rp100,000,000. measures-for-test.server.ts describes the portfolio of Sari, with BBCA, TLKM, and cash at weights of 0.5, 0.3, and 0.2. Eko and Fajar hold 10,000 shares of BBCA, worth Rp49,800,000, and Rp50,525,900 in cash, a weight of 0.496382 in BBCA, as the browser tests take it.
const quotes = [
  stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55.000Z"),
  stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:51.000Z"),
  stockQuote("AADI", [11_475, 11_125], "2026-10-30T09:14:58.000Z"),
];
const bbcaPortfolio = {
  cash: rupiah(50_525_900),
  holdings: [
    { code: "BBCA", shares: shares(10_000), cost: rupiah(49_874_700) },
  ],
};

interface TestStudent {
  username: string;
  name: string;
  portfolio: { cash: Rupiah; holdings: Holding[] } | undefined;
}

// The students in the order in which they join the class.
const students: readonly TestStudent[] = [
  {
    username: "sari",
    name: "Sari Wulandari",
    portfolio: {
      cash: rupiah(10_956_000),
      holdings: [
        { code: "BBCA", shares: shares(5_500), cost: rupiah(27_431_085) },
        { code: "TLKM", shares: shares(8_300), cost: rupiah(16_458_651) },
      ],
    },
  },
  { username: "eko", name: "Eko Prasetyo", portfolio: bbcaPortfolio },
  {
    username: "dewi",
    name: "Dewi Lestari",
    portfolio: {
      cash: rupiah(10_000_000),
      holdings: [
        { code: "AADI", shares: shares(1_000), cost: rupiah(11_492_213) },
      ],
    },
  },
  { username: "budi", name: "Budi Hartono", portfolio: undefined },
  {
    username: "rina",
    name: "Rina Kusuma",
    portfolio: {
      cash: rupiah(90_000_000),
      holdings: [
        { code: "AMMN", shares: shares(1_000), cost: rupiah(6_259_387) },
      ],
    },
  },
  { username: "fajar", name: "Fajar Nugroho", portfolio: bbcaPortfolio },
];

/**
 * A class of a database with the month-end closes of measures-for-test.server.ts and the quotes of BBCA, TLKM, and AADI that the price job fetched at 16:15 WIB on Friday 30 October 2026, and with six students, each joined an hour after the one before on 26 October 2026: Sari Wulandari (sari), Eko Prasetyo (eko), Dewi Lestari (dewi), Budi Hartono (budi), Rina Kusuma (rina), and Fajar Nugroho (fajar).
 * Sari holds BBCA, TLKM, and cash. Eko and Fajar hold the same BBCA and cash. Dewi holds AADI, which has too few monthly returns. Budi has no portfolio yet, and Rina holds AMMN, which has no delayed price.
 */
export async function classOfStudentsForTest(): Promise<{
  database: Database;
  taughtClass: TaughtClassDetails;
}> {
  const database = databaseWithClosesForTest();
  await updateQuotesForTest(database, sourceAnsweringForTest(quotes), {
    at: new Date("2026-10-30T09:15:00Z"),
  });
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const taught = findTaughtClass(database, classId, lecturerId);
  if (taught === undefined) {
    throw new Error("The test could not find the class that it created.");
  }
  for (const [index, student] of students.entries()) {
    const studentId = await createTestStudent(
      database,
      student.username,
      student.name,
    );
    joinClass(
      database,
      { classId, studentId },
      new Date(Date.UTC(2026, 9, 26, index)),
    );
    const joined = findJoinedClass(database, classId, studentId);
    if (joined === undefined) {
      throw new Error(`The test could not add ${student.username}.`);
    }
    if (student.portfolio !== undefined) {
      storeHoldingsForTest(
        database,
        {
          membershipId: joined.membershipId,
          startingCash: taught.startingCash,
        },
        student.portfolio,
      );
    }
  }
  return { database, taughtClass: taught };
}
