import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import express from "express";
import type { RequestHandler } from "express";
import { parseMode, parsePort } from "./server-options.ts";

// The build is this program's own server/app.ts, not outside data, so its type is asserted instead of parsed.
interface ServerBuild {
  app: RequestHandler;
}

const buildDirectory = join(import.meta.dirname, "..", "build");
// The server build is loaded through a variable path so that type checking does not depend on a build.
const serverBuildPath = join(buildDirectory, "server", "index.js");
const shutdownTimeoutMilliseconds = 10_000;

const { values: options } = parseArgs({
  options: { mode: { type: "string", default: "production" } },
});
const mode = parseMode(options.mode, "--mode");
const port = parsePort(process.env["PORT"] ?? "3000", "PORT");
if (!mode.ok) {
  exitWithFailure(mode.failure);
}
if (!port.ok) {
  exitWithFailure(port.failure);
}
const isDevelopment = mode.value === "development";

const server = express();
server.disable("x-powered-by");

if (isDevelopment) {
  const vite = await import("vite");
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
  });
  server.use(viteServer.middlewares);
  server.use((request, response, next) => {
    viteServer
      .ssrLoadModule("./server/app.ts")
      .then((module) => {
        const build = module as ServerBuild;
        return build.app(request, response, next);
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          viteServer.ssrFixStacktrace(error);
        }
        next(error);
      });
  });
} else {
  const build = (await import(
    pathToFileURL(serverBuildPath).href
  )) as ServerBuild;
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
    listener.close(() => process.exit(0));
    setTimeout(() => process.exit(1), shutdownTimeoutMilliseconds).unref();
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

function exitWithFailure(failure: string): never {
  writeLog("error", failure, {});
  process.exit(1);
}

function writeLog(
  level: "info" | "error",
  message: string,
  details: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...details,
  });
  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}
