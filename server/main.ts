import { join } from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import type { Express, RequestHandler } from "express";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { localNetworkAddresses } from "../app/local-network.server.ts";
import { secondMilliseconds } from "../app/time-units.ts";
import { writeLog } from "../app/write-log.server.ts";
import { failuresOf } from "../app/result.ts";
import {
  parseCommandLine,
  parseDatabasePath,
  parsePort,
  parsePriceSource,
} from "./server-options.ts";
import type { Mode, ServiceSettings } from "./server-options.ts";

// The server only keeps the services and hands them back to the build, so it needs no more of their shape.
interface Services {
  stop: () => void;
}

// The build is this program's own server/app.ts, not outside data, so its type is asserted instead of parsed.
interface ServerBuild {
  startServices: (settings: ServiceSettings) => Services;
  createApp: (services: Services) => RequestHandler;
}

const buildDirectory = join(import.meta.dirname, "..", "build");
// The server build is loaded through a variable path so that type checking does not depend on a build.
const serverBuildPath = join(buildDirectory, "server", "index.js");
const shutdownTimeoutMilliseconds = 10 * secondMilliseconds;

// Every setting is read before the server stops on any of them, so the log names every wrong setting at once.
const commandLine = parseCommandLine(process.argv.slice(2), "The command line");
const port = parsePort(process.env["PORT"], "PORT");
const priceSource = parsePriceSource(
  process.env["PRICE_SOURCE"],
  "PRICE_SOURCE",
);
const databasePath = parseDatabasePath(
  process.env["DATABASE_PATH"],
  "DATABASE_PATH",
);
if (!commandLine.ok || !port.ok || !priceSource.ok || !databasePath.ok) {
  exitWithFailure(
    failuresOf([commandLine, port, priceSource, databasePath]),
    writeError,
  );
}
const { mode, hotReloadPort } = commandLine.value;
const settings: ServiceSettings = {
  priceSource: priceSource.value,
  databasePath: databasePath.value,
  migrationsFolder: join(import.meta.dirname, "..", migrationsFolderName),
};
// Each mode serves the app in its own way, so a new mode is a type error until it has one.
const serveApp: Record<
  Mode,
  (server: Express, settings: ServiceSettings) => Promise<Services>
> = {
  development: (server, settings) =>
    serveWithDevServer(server, settings, hotReloadPort),
  production: serveBuiltApp,
};

const server = express();
server.disable("x-powered-by");
// Decision 0005 explains why Express trusts the headers of a proxy from these addresses only.
server.set("trust proxy", ["loopback", "uniquelocal"]);
const services = await serveApp[mode](server, settings);

const listener = server.listen(port.value, () => {
  const address = new URL(`http://localhost:${String(port.value)}/`);
  writeLog(
    "info",
    "Server started. Open the address on this computer. During a demonstration on a laptop, phones on the same Wi-Fi network open one of the local network addresses.",
    {
      mode,
      address: address.href,
      localNetworkAddresses: localNetworkAddresses(address),
    },
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    writeLog("info", "Server stopping.", { signal });
    listener.close(() => {
      services.stop();
      process.exit(0);
    });
    setTimeout(() => {
      exitWithFailure(
        [
          `The server did not close its connections within ${String(shutdownTimeoutMilliseconds / secondMilliseconds)} seconds, so it stopped without them.`,
        ],
        writeError,
      );
    }, shutdownTimeoutMilliseconds).unref();
  });
}

// Each request loads the app again, so edits apply without a restart. The services stay, and each new build gets an app that uses them.
async function serveWithDevServer(
  server: Express,
  settings: ServiceSettings,
  hotReloadPort: number | undefined,
): Promise<Services> {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: {
      middlewareMode: true,
      ...(hotReloadPort === undefined ? {} : { ws: { port: hotReloadPort } }),
    },
  });
  const loadBuild = async (): Promise<ServerBuild> =>
    (await viteServer.ssrLoadModule("./server/app.ts")) as ServerBuild;
  const services = (await loadBuild()).startServices(settings);
  const appsByBuild = new WeakMap<ServerBuild, RequestHandler>();
  const appFor = (latestBuild: ServerBuild): RequestHandler => {
    const existingApp = appsByBuild.get(latestBuild);
    if (existingApp !== undefined) {
      return existingApp;
    }
    const newApp = latestBuild.createApp(services);
    appsByBuild.set(latestBuild, newApp);
    return newApp;
  };
  server.use(viteServer.middlewares);
  server.use((request, response, next) => {
    loadBuild()
      .then((latestBuild) => {
        appFor(latestBuild)(request, response, next);
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          viteServer.ssrFixStacktrace(error);
        }
        next(error);
      });
  });
  return services;
}

async function serveBuiltApp(
  server: Express,
  settings: ServiceSettings,
): Promise<Services> {
  const build = (await import(
    pathToFileURL(serverBuildPath).href
  )) as ServerBuild;
  const services = build.startServices(settings);
  server.use(
    "/assets",
    express.static(join(buildDirectory, "client", "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  server.use(express.static(join(buildDirectory, "client"), { maxAge: "1h" }));
  server.use(build.createApp(services));
  return services;
}

function writeError(failure: string): void {
  writeLog("error", failure);
}
