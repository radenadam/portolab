import { and, eq, lt } from "drizzle-orm";
import type { Database } from "../../database/database.server.ts";
import { stockDailyCloses } from "./market-data.schema.ts";

/** Manual deletion can remove the returns of a holding that was buyable, so tests replay it with recorded prices. */
export function deleteStockClosesBeforeForTest(
  database: Database,
  code: string,
  date: string,
): void {
  database
    .delete(stockDailyCloses)
    .where(
      and(eq(stockDailyCloses.code, code), lt(stockDailyCloses.date, date)),
    )
    .run();
}
