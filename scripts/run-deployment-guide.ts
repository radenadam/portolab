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
import { parseContainerId, parseVolumeFolders } from "./container-volume.ts";
import type { VolumeFolders } from "./container-volume.ts";
import {
  backupFolder,
  checkSystemNamed,
  containerExecArguments,
  containerIdArguments,
  guidePath,
  parseRunArguments,
  parseServerBlocks,
  parseSystemRelease,
  serverFolder,
  splitAtUpdate,
  testDomain,
} from "./deployment-guide.ts";
import type { GuideParts, ServerBlock } from "./deployment-guide.ts";
import { parseJsonWith } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import { runCommand } from "./run-command.ts";
import {
  checkFolderOnlyForRoot,
  firstAccount,
  parseIdOutput,
} from "./user-numbers.ts";
import type { FolderListing } from "./user-numbers.ts";
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
let parts: GuideParts = { before: [], after: [] };
if (guide.ok && repository.ok) {
  const blocks = parseServerBlocks(guide.value, guidePath, repository.value);
  const splitBlocks = blocks.ok ? splitAtUpdate(blocks.value) : blocks;
  if (splitBlocks.ok) {
    parts = splitBlocks.value;
  } else {
    failures.push(splitBlocks.failure);
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
const failure = followGuide(parts, folder);
rmSync(folder, { recursive: true, force: true });
if (failure !== undefined) {
  exitWithFailure([failure], writeScriptFailure);
}
const readFailures = [...checkBackups(), ...checkDatabase()];
if (readFailures.length > 0) {
  exitWithFailure(readFailures, writeScriptFailure);
}

/** Runs each block in order, and makes an installation from before decision 0027 before the section that finds one, so that the guide moves it. Returns why the first step that failed failed, or undefined when every step succeeded. */
function followGuide(
  guideParts: GuideParts,
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
  return (
    runBlocks(guideParts.before, environment) ??
    makeEarlierInstallation() ??
    runBlocks(guideParts.after, environment)
  );
}

/** Runs each block in order, and returns why the first block that failed failed, or undefined when every block succeeded. */
function runBlocks(
  serverBlocks: readonly ServerBlock[],
  environment: NodeJS.ProcessEnv,
): string | undefined {
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

/** Gives the files of the database to the numbers as which the container ran Portolab before decision 0027, as an installation from that time has them, and returns why it failed, or undefined when it succeeded. */
function makeEarlierInstallation(): string | undefined {
  const owner = `${String(firstAccount.user)}:${String(firstAccount.group)}`;
  process.stdout.write(
    `\nThe test gives the files of the database to ${owner}, as an installation from before decision 0027 has them.\n\n`,
  );
  const folders = readVolumeFolders();
  const run = folders.ok
    ? runCommand("chown", ["--recursive", owner, folders.value.ofVolume])
    : folders;
  return run.ok ? undefined : run.failure;
}

/** Returns why the user of the container can read a file in the folder of the backups, which the container never opens, or why the test could not tell, and an empty list when it reads none. */
function checkBackups(): string[] {
  const user = readContainerNumber("--user");
  const group = readContainerNumber("--group");
  const listing = listFolder(backupFolder);
  if (!user.ok || !group.ok || !listing.ok) {
    return failuresOf([user, group, listing]);
  }
  return checkFiles(listing.value, { user: user.value, group: group.value });
}

/** Returns why the first account of a person can read a file of the database, through the process of the container or through the folder of its volume, or why the test could not tell, and an empty list when it reads none. */
function checkDatabase(): string[] {
  const folders = readVolumeFolders();
  if (!folders.ok) {
    return [folders.failure];
  }
  const databaseFailures: string[] = [];
  for (const databaseFolder of [
    folders.value.ofProcess,
    folders.value.ofVolume,
  ]) {
    const listing = listFolder(databaseFolder);
    databaseFailures.push(
      ...(listing.ok
        ? checkFiles(listing.value, firstAccount)
        : [listing.failure]),
    );
  }
  return databaseFailures;
}

function checkFiles(
  listing: FolderListing,
  identity: { user: number; group: number },
): string[] {
  return checkFolderOnlyForRoot(listing, identity.user, (path) => {
    const run = runCommand("test", ["-r", path], {
      answerCodes: [1],
      identity,
    });
    return run.ok ? succeed(run.value.code === 0) : run;
  });
}

/** Reads the number of the user or of the group as which the container of Portolab runs. */
function readContainerNumber(
  option: "--user" | "--group",
): Result<number, string> {
  const run = runCommand("docker", [...containerExecArguments, "id", option]);
  return run.ok
    ? parseIdOutput(
        run.value.stdout,
        `The output of id ${option} in the container of Portolab`,
      )
    : run;
}

/** Reads where a process of the server finds the files of the volume of the running container of Portolab. */
function readVolumeFolders(): Result<VolumeFolders, string> {
  const containers = runCommand("docker", containerIdArguments);
  const id = containers.ok
    ? parseContainerId(
        containers.value.stdout,
        "The output of docker compose ps --quiet for the service of Portolab",
      )
    : containers;
  if (!id.ok) {
    return id;
  }
  const details = runCommand("docker", [
    "inspect",
    "--format",
    "{{json .}}",
    id.value,
  ]);
  return details.ok
    ? parseJsonWith(
        details.value.stdout,
        `The output of docker inspect for the container ${id.value} of Portolab`,
        parseVolumeFolders,
      )
    : details;
}

function listFolder(listedFolder: string): Result<FolderListing, string> {
  try {
    return succeed({ folder: listedFolder, names: readdirSync(listedFolder) });
  } catch (error) {
    return fail(
      `The test could not list ${listedFolder}. Node reported: ${errorMessage(error)}`,
    );
  }
}
