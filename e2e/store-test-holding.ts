import { join } from "node:path";
import { eq } from "drizzle-orm";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import {
  holdings,
  portfolios,
} from "../app/features/trading/trading.schema.ts";
import type { Rupiah } from "../app/units/rupiah.ts";
import type { Shares } from "../app/units/shares.ts";
import { testDatabasePath } from "./test-database-path.ts";

/** Gives the one student of a class of a test a portfolio with a holding and the cash that its purchases left, as fills of earlier orders would leave them, by writing to the database of the test server. A fill needs a delayed price of a session of its trading day, which the fixture source never sends, so no order of a browser test fills. */
export function storeTestHolding(
  classId: ClassId,
  portfolio: { cash: Rupiah; code: string; shares: Shares; cost: Rupiah },
): void {
  const database = openDatabase(
    testDatabasePath(),
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  try {
    const membership = database
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.classId, classId))
      .get();
    if (membership === undefined) {
      throw new Error(
        `The class ${String(classId)} of the test has no student.`,
      );
    }
    database
      .insert(portfolios)
      .values({ membershipId: membership.id, cash: portfolio.cash })
      .run();
    database
      .insert(holdings)
      .values({
        membershipId: membership.id,
        code: portfolio.code,
        shares: portfolio.shares,
        cost: portfolio.cost,
      })
      .run();
  } finally {
    closeDatabase(database);
  }
}
