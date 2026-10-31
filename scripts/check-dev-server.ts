import { spawn } from "node:child_process";
import { utimesSync } from "node:fs";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { pageProblems, parseDevArguments } from "./dev-server-check.ts";
import type { PageAnswer } from "./dev-server-check.ts";
import { readJsonFile } from "./json.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Browser tests run the production build, so this check is what keeps `pnpm dev` working for contributors.
const port = 4174;
const startupTimeoutSeconds = 60;
// A request to a server that hangs ends after this, so the check names the failure and passes on the server's stderr instead of waiting until CI stops the job.
const requestTimeoutSeconds = 10;
const pages = ["/health", "/prices"];
// The dev server reloads an edited module and every module that imports it. These modules hold the database and its schema, which once lost the connection on a reload.
const editedModules = [
  "app/database/database.server.ts",
  "app/features/market-data/market-data.schema.ts",
];
const reloadSeconds = 2;

// The check runs the dev script itself, through the same Node binary, so it tests exactly what contributors run.
const devArguments = readJsonFile("package.json", parseDevArguments);
if (!devArguments.ok) {
  exitWithFailure([devArguments.failure], writeScriptFailure);
}

const server = spawn(process.execPath, devArguments.value, {
  env: {
    ...process.env,
    PORT: String(port),
    PRICE_SOURCE: "fixture",
    // A database in memory starts empty and leaves no file behind.
    DATABASE_PATH: ":memory:",
  },
  stdio: ["ignore", "ignore", "pipe"],
});
let serverErrors = "";
server.stderr.on("data", (chunk: Buffer) => {
  serverErrors += chunk.toString();
});

const problems: string[] = [];
try {
  if (await waitForHealth()) {
    problems.push(...pageProblems(await answersFrom(pages), "at startup"));
    // Touching a module makes the dev server reload it as if it was edited, without changing the code.
    const now = new Date();
    for (const module of editedModules) {
      utimesSync(module, now, now);
    }
    await waitSeconds(reloadSeconds);
    problems.push(...pageProblems(await answersFrom(pages), "after an edit"));
  } else {
    problems.push(
      `The development server did not answer on /health within ${String(startupTimeoutSeconds)} seconds.`,
    );
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

async function waitForHealth(): Promise<boolean> {
  const deadline = Date.now() + startupTimeoutSeconds * 1000;
  while (Date.now() < deadline) {
    try {
      const response = await requestPage("/health");
      if (response.ok) {
        return true;
      }
    } catch {
      // The server is still starting, so the connection is refused or the request runs out of time.
    }
    await waitSeconds(0.5);
  }
  return false;
}

function requestPage(path: string): Promise<Response> {
  return fetch(`http://localhost:${String(port)}${path}`, {
    signal: AbortSignal.timeout(requestTimeoutSeconds * 1000),
  });
}

function waitSeconds(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
