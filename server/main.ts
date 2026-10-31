import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import type { RequestHandler } from "express";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { writeLog } from "../app/log.server.ts";
import { failuresOf } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseCommandLine, parsePort } from "./server-options.ts";

// The build is this program's own server/app.ts, not outside data, so its type is asserted instead of parsed.
interface ServerBuild {
  app: RequestHandler;
  startServices: () => Result<() => void, string>;
}

const buildDirectory = join(import.meta.dirname, "..", "build");
// The server build is loaded through a variable path so that type checking does not depend on a build.
const serverBuildPath = join(buildDirectory, "server", "index.js");
const shutdownTimeoutMilliseconds = 10_000;

const mode = parseCommandLine(process.argv.slice(2), "The command line");
const port = parsePort(process.env["PORT"] ?? "3000", "PORT");
if (!mode.ok || !port.ok) {
  exitWithFailure(failuresOf([mode, port]), writeError);
}
const isDevelopment = mode.value === "development";

const server = express();
server.disable("x-powered-by");
let build: ServerBuild;

if (isDevelopment) {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
  });
  const loadBuild = async (): Promise<ServerBuild> =>
    (await viteServer.ssrLoadModule("./server/app.ts")) as ServerBuild;
  build = await loadBuild();
  server.use(viteServer.middlewares);
  // Each request loads the module again, so edits to the app apply without a restart.
  server.use((request, response, next) => {
    loadBuild()
      .then((latestBuild) => latestBuild.app(request, response, next))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          viteServer.ssrFixStacktrace(error);
        }
        next(error);
      });
  });
} else {
  build = (await import(pathToFileURL(serverBuildPath).href)) as ServerBuild;
  server.use(
    "/assets",
    express.static(join(buildDirectory, "client", "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  server.use(express.static(join(buildDirectory, "client"), { maxAge: "1h" }));
  server.use(build.app);
}

const services = build.startServices();
if (!services.ok) {
  exitWithFailure([services.failure], writeError);
}
const stopServices = services.value;

const listener = server.listen(port.value, () => {
  writeLog("info", "Server started.", {
    port: port.value,
    mode: mode.value,
    addresses: localNetworkAddresses(port.value),
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    writeLog("info", "Server stopping.", { signal });
    listener.close(() => {
      stopServices();
      process.exit(0);
    });
    setTimeout(() => {
      exitWithFailure(
        [
          `The server did not close its connections within ${String(shutdownTimeoutMilliseconds / 1000)} seconds, so it stopped without them.`,
        ],
        writeError,
      );
    }, shutdownTimeoutMilliseconds).unref();
  });
}

// Phones on the same Wi-Fi network open one of these addresses during a demonstration.
function localNetworkAddresses(port: number): string[] {
  const addresses: string[] = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(`http://${entry.address}:${String(port)}`);
      }
    }
  }
  return addresses;
}

function writeError(failure: string): void {
  writeLog("error", failure);
}
