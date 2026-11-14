import type { ClassId } from "../app/features/classes/classes.schema.ts";
import {
  holdings,
  portfolios,
} from "../app/features/trading/trading.schema.ts";
import type { Rupiah } from "../app/units/rupiah.ts";
import type { Shares } from "../app/units/shares.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

/** A holding of a portfolio of a test, with what its purchases cost. */
interface TestHolding {
  code: string;
  shares: Shares;
  cost: Rupiah;
}

/** Gives the one student of a class of a test a portfolio with a holding, the other holdings that the test gives, and the cash that their purchases left, as fills of earlier orders would leave them, by writing to the database of the test server. A fill needs a delayed price of a session of its trading day, which the fixture source never sends, so no order of a browser test fills. */
export function storeTestHolding(
  classId: ClassId,
  portfolio: TestHolding & { cash: Rupiah },
  otherHoldings: readonly TestHolding[] = [],
): void {
  writeForTestStudent(classId, (database, membershipId) => {
    database
      .insert(portfolios)
      .values({ membershipId, cash: portfolio.cash })
      .run();
    for (const { code, shares, cost } of [portfolio, ...otherHoldings]) {
      database
        .insert(holdings)
        .values({ membershipId, code, shares, cost })
        .run();
    }
  });
}
