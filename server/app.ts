import { createRequestHandler } from "@react-router/express";
import type { RequestHandler } from "express";
import { RouterContextProvider } from "react-router";
import type { ServerBuild } from "react-router";
import {
  closeDatabase,
  databaseContext,
  openDatabase,
} from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { createFixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { startPriceJob } from "~/features/market-data/price-job.server";
import { trackedInstruments } from "~/features/market-data/tracked-instruments";
import { createYahooPriceSource } from "~/features/market-data/yahoo-price-source.server";
import type { ServiceSettings } from "./server-options.ts";

export interface Services {
  database: Database;
  stop: () => void;
}

/** Opens the database and starts the price job, with the settings that the server read at startup. */
export function startServices(settings: ServiceSettings): Services {
  const database = openDatabase(settings.databasePath);
  const priceSource =
    settings.priceSource === "fixture"
      ? createFixturePriceSource()
      : createYahooPriceSource();
  const stopPriceJob = startPriceJob({
    database,
    priceSource,
    instruments: trackedInstruments,
  });
  return {
    database,
    stop: () => {
      stopPriceJob();
      closeDatabase(database);
    },
  };
}

/** Handles requests, and gives every loader and action the database of the services. */
export function createApp(services: Services): RequestHandler {
  return createRequestHandler({
    // The virtual module types `basename` as `string | undefined`, which exactOptionalPropertyTypes rejects for ServerBuild.
    build: () =>
      import("virtual:react-router/server-build") as Promise<ServerBuild>,
    getLoadContext() {
      const context = new RouterContextProvider();
      context.set(databaseContext, services.database);
      return context;
    },
  });
}
