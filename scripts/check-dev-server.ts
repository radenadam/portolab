import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { pageProblems, parseDevArguments } from "./dev-server-check.ts";
import type { PageAnswer } from "./dev-server-check.ts";
import { readJsonFile } from "./json.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Browser tests run the production build, so this check is what keeps `pnpm dev` working for contributors.
const port = 4174;
const startupTimeoutSeconds = 60;

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

const problems = (await waitForHealth())
  ? pageProblems(await answersFrom(["/health", "/prices"]))
  : [
      `The development server did not answer on /health within ${String(startupTimeoutSeconds)} seconds.`,
    ];
server.kill();

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
    const response = await fetch(`http://localhost:${String(port)}${path}`);
    answers.push({ path, status: response.status });
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
