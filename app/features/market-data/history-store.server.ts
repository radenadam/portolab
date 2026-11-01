import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { indexDailyCloses, stockDailyCloses } from "./market-data.schema";
import type { DailyHistory, Instrument } from "./price-source.server";

/** Stores the closes of a history. A close of a date that is stored already replaces the stored one, because the source adjusts earlier closes after a split. */
export function saveDailyHistory(
  database: Database,
  history: DailyHistory,
): void {
  const table = closesTable(history);
  const rows = history.closes.map((close) => ({
    code: history.code,
    date: close.date,
    close: close.close,
  }));
  // SQLite rejects an insert without rows.
  if (rows.length === 0) {
    return;
  }
  database
    .insert(table)
    .values(rows)
    .onConflictDoUpdate({
      target: [table.code, table.date],
      set: { close: sql`excluded.close` },
    })
    .run();
}

/** Lists the stored closes of an instrument, oldest first, which the measures take as their input. */
export function listDailyHistory(
  database: Database,
  instrument: Instrument,
): DailyHistory {
  switch (instrument.kind) {
    case "stock":
      return {
        kind: "stock",
        code: instrument.code,
        closes: database
          .select({
            date: stockDailyCloses.date,
            close: stockDailyCloses.close,
          })
          .from(stockDailyCloses)
          .where(eq(stockDailyCloses.code, instrument.code))
          .orderBy(asc(stockDailyCloses.date))
          .all(),
      };
    case "index":
      return {
        kind: "index",
        code: instrument.code,
        closes: database
          .select({
            date: indexDailyCloses.date,
            close: indexDailyCloses.close,
          })
          .from(indexDailyCloses)
          .where(eq(indexDailyCloses.code, instrument.code))
          .orderBy(asc(indexDailyCloses.date))
          .all(),
      };
  }
}

/** The codes of the instruments that have at least one stored close. */
export function listCodesWithHistory(database: Database): Set<string> {
  const codes = new Set<string>();
  for (const table of [stockDailyCloses, indexDailyCloses]) {
    for (const row of database
      .selectDistinct({ code: table.code })
      .from(table)
      .all()) {
      codes.add(row.code);
    }
  }
  return codes;
}

function closesTable(
  history: DailyHistory,
): typeof stockDailyCloses | typeof indexDailyCloses {
  switch (history.kind) {
    case "stock":
      return stockDailyCloses;
    case "index":
      return indexDailyCloses;
  }
}
