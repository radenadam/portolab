import { eq } from "drizzle-orm";
import type { Database } from "../app/database/database.server.ts";
import type {
  ClassId,
  MembershipId,
} from "../app/features/classes/classes.schema.ts";
import { portfolios } from "../app/features/trading/trading.schema.ts";
import type { PortfolioId } from "../app/features/trading/trading.schema.ts";
import type { Rupiah } from "../app/units/rupiah.ts";

export function storeTestPortfolio(
  database: Database,
  owner: { membershipId: MembershipId } | { demonstrationClassId: ClassId },
  cash: Rupiah,
): PortfolioId {
  database
    .insert(portfolios)
    .values({ ...owner, cash })
    .onConflictDoNothing()
    .run();
  const row = database
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(
      "membershipId" in owner
        ? eq(portfolios.membershipId, owner.membershipId)
        : eq(portfolios.demonstrationClassId, owner.demonstrationClassId),
    )
    .get();
  if (row === undefined) throw new Error("The test portfolio was not stored.");
  return row.id;
}
