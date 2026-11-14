import { spawn } from "node:child_process";
import { utimesSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { secondMilliseconds } from "../app/time-units.ts";
import { checkSlotVariable, parseCheckSettings } from "./check-settings.ts";
import {
  isAppModule,
  modulesToEdit,
  pageProblems,
  parseDevArguments,
} from "./dev-server-check.ts";
import type { PageAnswer } from "./dev-server-check.ts";
import { readJsonFile } from "./json.ts";
import { readFilesIn } from "./read-files-in.ts";
import { waitForHealth, watchExit } from "./wait-for-health.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Browser tests run the production build, so this check is what keeps `pnpm dev` working for contributors.
const startupTimeoutSeconds = 60;
// A request to a server that hangs ends after this, so the check names the failure and passes on the server's stderr instead of waiting until CI stops the job.
const requestTimeoutSeconds = 10;
const pages = ["/health", "/prices"];
const reloadSeconds = 2;

// The check runs the dev script itself, through the same Node binary, so it tests exactly what contributors run.
const devArguments = readJsonFile("package.json", parseDevArguments);
const ports = parseCheckSettings(
  process.env[checkSlotVariable],
  checkSlotVariable,
);

// The dev server reloads an edited module and every module that imports it, so the check edits each module that holds a service, which the code itself names.
const editedModules = modulesToEdit(readFilesIn("app", isAppModule));

const inputProblems: string[] = [];
if (!devArguments.ok) {
  inputProblems.push(devArguments.failure);
}
if (!ports.ok) {
  inputProblems.push(ports.failure);
}
if (editedModules.length === 0) {
  inputProblems.push(
    "The check found no module in app/ that creates a context or holds a schema, so an edit would prove nothing about the services.",
  );
}
if (!devArguments.ok || !ports.ok || inputProblems.length > 0) {
  exitWithFailure(inputProblems, writeScriptFailure);
}

const baseUrl = `http://localhost:${String(ports.value.development)}`;
const serverArguments = [
  ...devArguments.value,
  "--hot-reload-port",
  String(ports.value.hotReload),
];
const server = spawn(process.execPath, serverArguments, {
  env: {
    ...process.env,
    PORT: String(ports.value.development),
    PRICE_SOURCE: "fixture",
    // A database in memory starts empty and leaves no file behind.
    DATABASE_PATH: ":memory:",
  },
  stdio: ["ignore", "ignore", "pipe"],
});
const serverExit = watchExit(server);
let serverErrors = "";
server.stderr.on("data", (chunk: Buffer) => {
  serverErrors += chunk.toString();
});

const problems: string[] = [];
try {
  const wait = await waitForHealth(`${baseUrl}/health`, {
    timeoutSeconds: startupTimeoutSeconds,
    requestTimeoutSeconds,
    stopReason: serverExit.reason,
  });
  switch (wait.kind) {
    case "answered": {
      problems.push(...pageProblems(await answersFrom(pages), "at startup"));
      // Touching a module makes the dev server reload it as if it was edited, without changing the code.
      const now = new Date();
      for (const module of editedModules) {
        utimesSync(module, now, now);
      }
      await pause(reloadSeconds * secondMilliseconds);
      problems.push(...pageProblems(await answersFrom(pages), "after an edit"));
      break;
    }
    case "stopped":
      problems.push(
        `The development server stopped with ${wait.reason} before it answered on /health.`,
      );
      break;
    case "timedOut":
      problems.push(
        `The development server did not answer on /health within ${String(startupTimeoutSeconds)} seconds.`,
      );
      break;
  }
} finally {
  server.kill();
}

if (problems.length > 0) {
  exitWithFailure(
    serverErrors === ""
      ? problems
      : [...problems, `The development server wrote: ${serverErrors}`],
    writeScriptFailure,
  );
}

async function answersFrom(paths: readonly string[]): Promise<PageAnswer[]> {
  const answers: PageAnswer[] = [];
  for (const path of paths) {
    try {
      const response = await requestPage(path);
      answers.push({ path, outcome: { status: response.status } });
    } catch (error) {
      answers.push({
        path,
        outcome: { connectionFailure: errorMessage(error) },
      });
    }
  }
  return answers;
}

function requestPage(path: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(requestTimeoutSeconds * secondMilliseconds),
  });
}
