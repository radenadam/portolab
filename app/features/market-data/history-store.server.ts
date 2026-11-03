import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "../../database/database.server.ts";
import { indexDailyCloses, stockDailyCloses } from "./market-data.schema.ts";
import type {
  DailyHistory,
  IndexCode,
  IndexHistory,
  Instrument,
  StockHistory,
} from "./price-source.server.ts";

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
      return listStockHistory(database, instrument.code);
    case "index":
      return listIndexHistory(database, instrument.code);
  }
}

/** Lists the stored closes of a stock, oldest first. */
export function listStockHistory(
  database: Database,
  code: string,
): StockHistory {
  return {
    kind: "stock",
    code,
    closes: database
      .select({ date: stockDailyCloses.date, close: stockDailyCloses.close })
      .from(stockDailyCloses)
      .where(eq(stockDailyCloses.code, code))
      .orderBy(asc(stockDailyCloses.date))
      .all(),
  };
}

/** Lists the stored levels of an index at its closes, oldest first. */
export function listIndexHistory(
  database: Database,
  code: IndexCode,
): IndexHistory {
  return {
    kind: "index",
    code,
    closes: database
      .select({ date: indexDailyCloses.date, close: indexDailyCloses.close })
      .from(indexDailyCloses)
      .where(eq(indexDailyCloses.code, code))
      .orderBy(asc(indexDailyCloses.date))
      .all(),
  };
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
