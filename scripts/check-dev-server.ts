import { spawn } from "node:child_process";
import { utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { pageProblems, parseDevArguments } from "./dev-server-check.ts";
import type { PageAnswer } from "./dev-server-check.ts";
import { readJsonFile } from "./json.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Browser tests run the production build, so this check is what keeps `pnpm dev` working for contributors.
const port = 4174;
const startupTimeoutSeconds = 60;
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
    DATABASE_PATH: join(
      tmpdir(),
      `portolab-dev-check-${String(Date.now())}.sqlite`,
    ),
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
    await new Promise((resolve) => setTimeout(resolve, reloadSeconds * 1000));
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
      const response = await fetch(`http://localhost:${String(port)}${path}`);
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
      const response = await fetch(`http://localhost:${String(port)}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // The server is still starting, so the connection is refused.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}
