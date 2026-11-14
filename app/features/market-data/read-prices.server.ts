import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPriceSourceDescription } from "./price-source-context.server";
import type { PriceSourceDescription, Quote } from "./price-source.server";
import { listLatestQuotes } from "./quote-store.server";
import { readLatestUpdateAttempt } from "./update-attempts.server";
import type { UpdateAttempt } from "./update-attempts.server";

/** Sharing one moment keeps the price status and its next attempt consistent. */
export interface PricesOfView {
  quotes: Quote[];
  latestAttempt: UpdateAttempt | undefined;
  now: Date;
  source: PriceSourceDescription;
}

/** Reads the latest delayed prices with the latest attempt of the quote job and the source of the prices. The moment comes from the server, so the page that the browser takes over says the same as the page that the server drew. */
export function readPrices(
  context: Readonly<RouterContextProvider>,
  now: Date,
): PricesOfView {
  const database = context.get(databaseContext);
  return {
    quotes: listLatestQuotes(database),
    latestAttempt: readLatestUpdateAttempt(database, "quotes"),
    now,
    source: readPriceSourceDescription(context),
  };
}
