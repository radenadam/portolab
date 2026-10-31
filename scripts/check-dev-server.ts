import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Browser tests run the production build, so this check is what keeps `pnpm dev` working for contributors.
const port = 4174;
const startupTimeoutMilliseconds = 60_000;

// The check runs the dev script itself, through the same Node binary, so it tests exactly what contributors run.
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};
const [program, ...devArguments] = (packageJson.scripts["dev"] ?? "").split(
  " ",
);
if (program !== "node") {
  process.stderr.write(
    'The dev script must start with "node", so this check can run it.\n',
  );
  process.exit(1);
}

const server = spawn(process.execPath, devArguments, {
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

const problems = await checkPages();
server.kill();

if (problems.length > 0) {
  process.stderr.write(
    `The development server failed: ${problems.join(" ")}\n${serverErrors}`,
  );
  process.exit(1);
}

async function checkPages(): Promise<string[]> {
  if (!(await waitForHealth())) {
    return [
      `It did not answer on /health within ${String(startupTimeoutMilliseconds / 1000)} seconds.`,
    ];
  }
  const problems: string[] = [];
  for (const path of ["/health", "/prices"]) {
    const response = await fetch(`http://localhost:${String(port)}${path}`);
    if (!response.ok) {
      problems.push(`${path} answered with status ${String(response.status)}.`);
    }
  }
  return problems;
}

async function waitForHealth(): Promise<boolean> {
  const deadline = Date.now() + startupTimeoutMilliseconds;
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
