import { asc, desc as descending, eq, sql } from "drizzle-orm";
import type { Database } from "~/database/database.server";
import { indexDailyCloses, stockDailyCloses } from "./market-data.schema";
import type {
  DailyClose,
  DailyHistory,
  Instrument,
} from "./price-source.server";

/** Stores the closes of a history. A close of a date that is stored already replaces the stored one, because each update asks again for the latest stored close. */
export function saveDailyHistory(
  database: Database,
  history: DailyHistory,
): void {
  writeCloses(database, history, "keep");
}

/** Replaces every stored close of the instrument of a history with the closes of the history. A source adjusts every earlier close after a split, so the stored closes no longer fit its new ones. */
export function replaceDailyHistory(
  database: Database,
  history: DailyHistory,
): void {
  writeCloses(database, history, "delete");
}

/** The latest stored close of an instrument, or undefined when Portolab has stored none. */
export function readLatestClose(
  database: Database,
  instrument: Instrument,
): DailyClose<number> | undefined {
  const table = closesTable(instrument);
  const [row] = database
    .select({ date: table.date, close: table.close })
    .from(table)
    .where(eq(table.code, instrument.code))
    .orderBy(descending(table.date))
    .limit(1)
    .all();
  return row;
}

/**
 * Lists the stored closes of an instrument, oldest first, which the measures take as their input.
 * @internal Only tests read the stored closes so far, because the screens that show the measures are not built yet.
 */
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
  instrument: Instrument,
): typeof stockDailyCloses | typeof indexDailyCloses {
  switch (instrument.kind) {
    case "stock":
      return stockDailyCloses;
    case "index":
      return indexDailyCloses;
  }
}

function writeCloses(
  database: Database,
  history: DailyHistory,
  storedCloses: "keep" | "delete",
): void {
  const table = closesTable(history);
  const rows = history.closes.map((close) => ({
    code: history.code,
    date: close.date,
    close: close.close,
  }));
  database.transaction((transaction) => {
    if (storedCloses === "delete") {
      transaction.delete(table).where(eq(table.code, history.code)).run();
    }
    // SQLite rejects an insert without rows.
    if (rows.length > 0) {
      transaction
        .insert(table)
        .values(rows)
        .onConflictDoUpdate({
          target: [table.code, table.date],
          set: { close: sql`excluded.close` },
        })
        .run();
    }
  });
}
