import type { Database } from "../../database/database.server.ts";
import { monthEndClosesForTest } from "../measures/month-end-closes-for-test.ts";
import { fixtureHistory } from "./fixture-history.ts";
import { saveDailyHistory } from "./history-store.server.ts";
import { trackedInstruments } from "./tracked-instruments.ts";

const recordedWeekStart = "2026-10-26";

/** Shared recorded histories keep unit and browser fixtures on the same prices. */
export function saveFixtureHistoryForTest(
  database: Database,
  monthEndCodes: readonly Parameters<typeof monthEndClosesForTest>[0][],
): void {
  for (const code of monthEndCodes) {
    saveDailyHistory(database, monthEndClosesForTest(code));
  }
  for (const instrument of trackedInstruments) {
    // One stock keeps no closes so the screens must explain missing history.
    if (instrument.code === "ADMR") continue;
    const history = fixtureHistory(instrument, recordedWeekStart);
    if (history === undefined) {
      throw new Error(`The fixture records no closes of ${instrument.code}.`);
    }
    saveDailyHistory(database, history);
  }
}
