import { createRequestHandler } from "@react-router/express";
import type { Request, RequestHandler } from "express";
import { RouterContextProvider } from "react-router";
import type { ServerBuild } from "react-router";
import {
  clientAddressContext,
  parseNetworkAddress,
} from "~/client-address.server";
import {
  closeDatabase,
  databaseContext,
  openDatabase,
} from "~/database/database.server";
import type { Database } from "~/database/database.server";
import {
  createPasswordLimiters,
  passwordLimitersContext,
} from "~/features/accounts/password-attempts.server";
import type { PasswordLimiters } from "~/features/accounts/password-attempts.server";
import { startSessionSweep } from "~/features/accounts/start-session-sweep.server";
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
  passwordLimiters: PasswordLimiters;
  stop: () => void;
}

/** Opens the database, starts the price job and the sweep of ended sessions, and creates the limits on passwords, with the settings that the server read at startup. */
export function startServices(settings: ServiceSettings): Services {
  const database = openDatabase(
    settings.databasePath,
    settings.migrationsFolder,
  );
  const priceSource = priceSources[settings.priceSource]();
  const stopPriceJob = startPriceJob({
    database,
    priceSource,
    instruments: trackedInstruments,
  });
  const stopSessionSweep = startSessionSweep(database);
  return {
    database,
    priceSource,
    passwordLimiters: createPasswordLimiters(),
    stop: () => {
      stopPriceJob();
      stopSessionSweep();
      closeDatabase(database);
    },
  };
}

/** Handles requests, and gives every loader and action the services and the address that the request came from. */
export function createApp(services: Services): RequestHandler {
  return createRequestHandler({
    // The virtual module types `basename` as `string | undefined`, which exactOptionalPropertyTypes rejects for ServerBuild.
    build: () =>
      import("virtual:react-router/server-build") as Promise<ServerBuild>,
    getLoadContext(request) {
      const context = new RouterContextProvider();
      context.set(databaseContext, services.database);
      context.set(priceSourceContext, services.priceSource);
      context.set(passwordLimitersContext, services.passwordLimiters);
      context.set(clientAddressContext, clientAddress(request));
      return context;
    },
  });
}

// A proxy that forges its header gives the address of its own connection instead, which is a real address. Express knows no address only when the connection already closed, and such a request shares the limits of every other one like it.
function clientAddress(request: Request): string {
  const forwarded = parseNetworkAddress(request.ip, "The address of a request");
  return forwarded.ok ? forwarded.value : (request.socket.remoteAddress ?? "");
}
