import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import express from "express";
import type { RequestHandler } from "express";
import { writeLog } from "../app/log.server.ts";
import type { Result } from "../app/result.ts";

interface ServerBuild {
  app: RequestHandler;
  startServices: () => Result<() => void, string>;
}

const buildDirectory = join(import.meta.dirname, "..", "build");
// The server build is loaded through a variable path so that type checking does not depend on a build.
const serverBuildPath = join(buildDirectory, "server", "index.js");
const shutdownTimeoutMilliseconds = 10_000;

const { values: options } = parseArgs({
  options: { mode: { type: "string", default: "production" } },
});
const isDevelopment = options.mode === "development";
const port = parsePort(process.env["PORT"] ?? "3000");

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
  writeLog("error", services.failure);
  process.exit(1);
}
const stopServices = services.value;

const listener = server.listen(port, () => {
  writeLog("info", "Server started.", {
    port,
    mode: options.mode,
    addresses: localNetworkAddresses(),
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    writeLog("info", "Server stopping.", { signal });
    listener.close(() => {
      stopServices();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), shutdownTimeoutMilliseconds).unref();
  });
}

function parsePort(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    writeLog("error", "PORT must be a whole number from 1 to 65535.", {
      value,
    });
    process.exit(1);
  }
  return parsed;
}

// Phones on the same Wi-Fi network open one of these addresses during a demonstration.
function localNetworkAddresses(): string[] {
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
