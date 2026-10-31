import { createRequestHandler } from "@react-router/express";
import express from "express";
import type { Express } from "express";
import { RouterContextProvider } from "react-router";
import type { ServerBuild } from "react-router";
import { readConfig } from "~/config.server";
import {
  connectDatabase,
  disconnectDatabase,
} from "~/database/database.server";
import { createFixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { startPriceJob } from "~/features/market-data/price-job.server";
import { trackedInstruments } from "~/features/market-data/tracked-instruments";
import { createYahooPriceSource } from "~/features/market-data/yahoo-price-source.server";
import { succeed } from "~/result";
import type { Result } from "~/result";

export const app: Express = express();

app.use(
  createRequestHandler({
    // The virtual module types `basename` as `string | undefined`, which exactOptionalPropertyTypes rejects for ServerBuild.
    build: () =>
      import("virtual:react-router/server-build") as Promise<ServerBuild>,
    getLoadContext() {
      return new RouterContextProvider();
    },
  }),
);

/** Connects the database and starts the price job. Returns a function that stops both, or a sentence that explains why they cannot start. */
export function startServices(): Result<() => void, string> {
  const config = readConfig(process.env);
  if (!config.ok) {
    return config;
  }
  connectDatabase(config.value.databasePath);
  const priceSource =
    config.value.priceSource === "fixture"
      ? createFixturePriceSource()
      : createYahooPriceSource();
  const stopPriceJob = startPriceJob(priceSource, trackedInstruments);
  return succeed(() => {
    stopPriceJob();
    disconnectDatabase();
  });
}
