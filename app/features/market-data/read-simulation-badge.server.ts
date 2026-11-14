import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "./price-source-context.server";
import { listLatestQuotes } from "./quote-store.server";
import { simulationCardText } from "./simulation-card-text";
import { readLatestUpdateAttempt } from "./update-attempts.server";

/** What the badge of the simulation shows on every page: the delay of the prices, and the paragraphs of its card in the language of the request. */
export interface SimulationBadgeData {
  delayMinutes: number;
  card: string[];
}

/** Reads the badge of the simulation at a moment from the source of the prices and the latest quotes and attempt of the quote job. */
export function readSimulationBadge(
  context: Readonly<RouterContextProvider>,
  now: Date,
): SimulationBadgeData {
  const database = context.get(databaseContext);
  const source = readPriceSourceDescription(context);
  return {
    delayMinutes: source.delayMinutes,
    card: simulationCardText(
      listLatestQuotes(database),
      readLatestUpdateAttempt(database, "quotes"),
      { now, source },
    ),
  };
}
