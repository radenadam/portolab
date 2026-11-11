import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { errorMessage } from "../app/error-message.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { fail, failuresOf, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { minuteMilliseconds } from "../app/time-units.ts";
import {
  backupFolder,
  checkBackupsOnlyForRoot,
  checkSystemNamed,
  containerExecArguments,
  guidePath,
  parseIdOutput,
  parseRunArguments,
  parseServerBlocks,
  parseSystemRelease,
  serverFolder,
  testDomain,
} from "./deployment-guide.ts";
import type { ServerBlock } from "./deployment-guide.ts";
import { readTextFile } from "./read-text-file.ts";
import { runCommand } from "./run-command.ts";
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
const release = releaseText.ok
  ? parseSystemRelease(releaseText.value, "/etc/os-release")
  : releaseText;
const failures = failuresOf([repository, guide, release]);
// The blocks need the guide and the repository, and the check of the system needs the guide and the release, so each runs once its own inputs are read, whatever else failed.
let blocks: ServerBlock[] = [];
if (guide.ok && repository.ok) {
  const parsedBlocks = parseServerBlocks(
    guide.value,
    guidePath,
    repository.value,
  );
  if (parsedBlocks.ok) {
    blocks = parsedBlocks.value;
  } else {
    failures.push(parsedBlocks.failure);
  }
}
if (guide.ok && release.ok) {
  const named = checkSystemNamed(guide.value, release.value);
  if (!named.ok) {
    failures.push(named.failure);
  }
}
if (failures.length > 0) {
  exitWithFailure(failures, writeScriptFailure);
}

const folder = mkdtempSync(join(tmpdir(), "portolab-deployment-"));
const failure = followGuide(blocks, folder);
rmSync(folder, { recursive: true, force: true });
if (failure !== undefined) {
  exitWithFailure([failure], writeScriptFailure);
}
// An account of the server can have the numbers of the user and the group of the container, so the test checks with those numbers that it can read no backup.
const backupFailures = checkBackups();
if (backupFailures.length > 0) {
  exitWithFailure(backupFailures, writeScriptFailure);
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

/** Returns why the user of the container can read a file in the folder of the backups, or why the test could not tell, and an empty list when only root reads them. */
function checkBackups(): string[] {
  const user = readContainerId("--user");
  const group = readContainerId("--group");
  const names = listBackupFolder();
  const failures = failuresOf([user, group, names]);
  if (!user.ok || !group.ok || !names.ok) {
    return failures;
  }
  const identity = { user: user.value, group: group.value };
  return checkBackupsOnlyForRoot(names.value, identity.user, (path) => {
    const run = runCommand("test", ["-r", path], {
      answerCodes: [1],
      identity,
    });
    return run.ok ? succeed(run.value.code === 0) : run;
  });
}

/** Reads the number of the user or of the group as which the container of Portolab runs. */
function readContainerId(option: "--user" | "--group"): Result<number, string> {
  const run = runCommand("docker", [...containerExecArguments, "id", option]);
  return run.ok
    ? parseIdOutput(
        run.value.stdout,
        `The output of id ${option} in the container of Portolab`,
      )
    : run;
}

function listBackupFolder(): Result<string[], string> {
  try {
    return succeed(readdirSync(backupFolder));
  } catch (error) {
    return fail(
      `The test could not list ${backupFolder}. Node reported: ${errorMessage(error)}`,
    );
  }
}
