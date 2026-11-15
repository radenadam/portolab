import { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { secondMilliseconds } from "~/time-units";
import { successValueForTest } from "~/success-value-for-test";
import { fixturePriceSource } from "./fixture-price-source.server";
import { saveFixtureHistoryForTest } from "./save-fixture-history-for-test.server";
import { priceSourceContext } from "./price-source-context.server";
import { saveQuotes } from "./quote-store.server";
import { trackedInstruments } from "./tracked-instruments";

/** Recorded closes expose missing quotes and short histories without inventing prices. */
export async function marketContextForTest(): Promise<RouterContextProvider> {
  const database = openDatabaseForTest();
  saveFixtureHistoryForTest(database, ["IHSG", "BBCA", "TLKM", "AMMN", "AADI"]);
  const batch = successValueForTest(
    await fixturePriceSource.fetchQuotes(
      trackedInstruments,
      AbortSignal.timeout(secondMilliseconds),
    ),
    "The recorded quotes are available",
  );
  saveQuotes(database, batch.quotes, new Date("2026-11-14T00:00:00.000Z"));
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(priceSourceContext, fixturePriceSource);
  return context;
}
