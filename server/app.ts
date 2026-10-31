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
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { startPriceJob } from "~/features/market-data/price-job.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import type { PriceSource } from "~/features/market-data/price-source.server";
import { trackedInstruments } from "~/features/market-data/tracked-instruments";
import { createYahooPriceSource } from "~/features/market-data/yahoo-price-source.server";
import type { ServiceSettings } from "./server-options.ts";

const priceSources: Record<ServiceSettings["priceSource"], () => PriceSource> =
  {
    yahoo: createYahooPriceSource,
    fixture: () => fixturePriceSource,
  };

export interface Services {
  database: Database;
  priceSource: PriceSource;
  stop: () => void;
}

/** Opens the database and starts the price job, with the settings that the server read at startup. */
export function startServices(settings: ServiceSettings): Services {
  const database = openDatabase(settings.databasePath);
  const priceSource = priceSources[settings.priceSource]();
  const stopPriceJob = startPriceJob({
    database,
    priceSource,
    instruments: trackedInstruments,
  });
  return {
    database,
    priceSource,
    stop: () => {
      stopPriceJob();
      closeDatabase(database);
    },
  };
}

/** Handles requests, and gives every loader and action the database and the price source of the services. */
export function createApp(services: Services): RequestHandler {
  return createRequestHandler({
    // The virtual module types `basename` as `string | undefined`, which exactOptionalPropertyTypes rejects for ServerBuild.
    build: () =>
      import("virtual:react-router/server-build") as Promise<ServerBuild>,
    getLoadContext() {
      const context = new RouterContextProvider();
      context.set(databaseContext, services.database);
      context.set(priceSourceContext, services.priceSource);
      return context;
    },
  });
}
