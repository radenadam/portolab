import { spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { minuteMilliseconds } from "../app/time-units.ts";
import {
  checkSystemNamed,
  guidePath,
  parseRunArguments,
  parseServerBlocks,
  parseSystemRelease,
  serverFolder,
  testDomain,
} from "./deployment-guide.ts";
import type { ServerBlock } from "./deployment-guide.ts";
import { readTextFile } from "./read-text-file.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The first build of Portolab takes minutes on a small server, and a block that hangs fails by name before the step of the workflow ends.
const blockTimeoutMilliseconds = 15 * minuteMilliseconds;

// The test needs no real prices, and decision 0001 asks for a low load on Yahoo Finance, so Portolab serves the recorded prices of the tests. Compose merges this file into compose.yaml for every command of the guide.
const recordedPrices = `services:
  app:
    environment:
      PRICE_SOURCE: fixture
`;

// The workflow of the deployment runs this script as root on a fresh Ubuntu machine. Each block runs in a shell of its own that starts in the home folder of root, as a reader who connects to the server again for each section would, so that every block works on its own.
const repository = parseRunArguments(process.argv.slice(2), "The command line");
const guide = readTextFile(guidePath);
const releaseText = readTextFile("/etc/os-release");
if (!repository.ok || !guide.ok || !releaseText.ok) {
  exitWithFailure(
    failuresOf([repository, guide, releaseText]),
    writeScriptFailure,
  );
}
const blocks = parseServerBlocks(guide.value, guidePath, repository.value);
const release = parseSystemRelease(releaseText.value, "/etc/os-release");
const named = release.ok
  ? checkSystemNamed(guide.value, release.value)
  : release;
if (!blocks.ok || !named.ok) {
  exitWithFailure(failuresOf([blocks, named]), writeScriptFailure);
}

const folder = mkdtempSync(join(tmpdir(), "portolab-deployment-"));
const failure = followGuide(blocks.value, folder);
rmSync(folder, { recursive: true, force: true });
if (failure !== undefined) {
  exitWithFailure([failure], writeScriptFailure);
}

/** Runs each block in order, and returns why the first block that failed failed, or undefined when every block succeeded. */
function followGuide(
  serverBlocks: readonly ServerBlock[],
  temporaryFolder: string,
): string | undefined {
  const pricesFile = join(temporaryFolder, "recorded-prices.yaml");
  try {
    // Only the test machine resolves the domain of the test, as DNS resolves the domain of a real server.
    appendFileSync("/etc/hosts", `127.0.0.1 ${testDomain}\n`);
    writeFileSync(pricesFile, recordedPrices);
  } catch (error) {
    return `The test could not prepare the machine for the guide. Node reported: ${errorMessage(error)}`;
  }
  const environment = {
    ...process.env,
    COMPOSE_FILE: `${join(serverFolder, "compose.yaml")}:${pricesFile}`,
  };
  for (const { section, commands } of serverBlocks) {
    process.stdout.write(`\nThe section "${section}" runs:\n${commands}\n\n`);
    const run = spawnSync("bash", ["-euxo", "pipefail", "-c", commands], {
      cwd: homedir(),
      env: environment,
      stdio: ["ignore", "inherit", "inherit"],
      timeout: blockTimeoutMilliseconds,
    });
    const name = `A block of commands in the section "${section}" of ${guidePath}`;
    // Node sets an error when the shell cannot start or runs out of time.
    if (run.error !== undefined) {
      return `${name} failed. Node reported: ${run.error.message}`;
    }
    if (run.status === null) {
      return `${name} was ended by the signal ${String(run.signal)}.`;
    }
    if (run.status !== 0) {
      return `${name} ended with code ${String(run.status)}, and its log above names the command that failed.`;
    }
  }
  return undefined;
}
