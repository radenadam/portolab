import { parseArgs } from "node:util";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { listOfWords } from "../app/sentences.ts";
import { parseChoice } from "../app/value-parsers.ts";
import { describeValue, isStringArray } from "../app/value-shapes.ts";
import type { ChangedFile } from "./review-lenses.ts";

/** The guide that the test follows on a fresh machine. */
export const guidePath = "docs/deploy.md";

/** The folder into which the guide installs Portolab on the server. */
export const serverFolder = "/opt/portolab";

/** The domain of the server in the test, which only the test machine resolves. Caddy serves a name under .internal with a certificate of its own authority, because Let's Encrypt cannot reach it. */
export const testDomain = "portolab.internal";

/** The example domain of the guide, which the test replaces with its own. */
const exampleDomain = "portolab.example.com";

/** The repository that the guide clones, which the test replaces with the one that the caller gives, so that it installs the commit under test. */
const exampleRepository = "https://github.com/radenadam/portolab.git";

/** The date of the backup that the guide restores, which the test replaces with the date of the backup that the guide made a moment earlier, as the shell writes it when it runs the command. */
const exampleBackupDate = "2026-11-10";

// The guide marks a block of commands for the server with sh, and a block for the computer of the reader with text.
const blockKinds = ["sh", "text"] as const;
type BlockKind = (typeof blockKinds)[number];

/** The events that start the test of the guide. */
const testEvents = ["pull_request", "schedule", "workflow_dispatch"] as const;
type TestEvent = (typeof testEvents)[number];

/** The files of the deployment and of its test, each as its path or as a folder that ends in a slash. A change to any of them runs the test again. The helpers that the test shares with the other browser tests are left out, because pnpm check runs them for every change, and the scheduled run of the test follows the guide with them. */
const deploymentPaths = [
  ".dockerignore",
  ".github/workflows/deployment.yml",
  "Caddyfile",
  "Dockerfile",
  "compose.yaml",
  guidePath,
  "e2e/deployment/",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts/deployment-guide.ts",
  "scripts/plan-deployment-test.ts",
  "scripts/run-deployment-guide.ts",
  "server/",
];

/** A block of commands of the guide that runs on the server, with the heading of its section, which names the block in the log and in a failure. */
export interface ServerBlock {
  section: string;
  commands: string;
}

/** The system of a machine, as /etc/os-release names it, such as Ubuntu 24.04. */
export interface SystemRelease {
  name: string;
  version: string;
}

/** Reads the event that started the workflow of the test, as GitHub names it. */
export function parseTestEvent(
  value: unknown,
  source: string,
): Result<TestEvent, string> {
  return parseChoice(value, source, testEvents);
}

/** Whether the test follows the guide for an event. A pull request runs it when its change touches the deployment or its test. A run on a schedule or by hand always runs it, because what the guide installs also changes outside the repository, such as the packages of Docker and Caddy. */
export function followsGuide(
  event: TestEvent,
  readChange: () => Result<ChangedFile[], string>,
): Result<boolean, string> {
  switch (event) {
    case "pull_request": {
      const change = readChange();
      return change.ok ? succeed(touchesDeployment(change.value)) : change;
    }
    case "schedule":
    case "workflow_dispatch":
      return succeed(true);
  }
}

/** Reads the command line of the test, whose only option, --repository, names the repository that the guide clones. */
export function parseRunArguments(
  value: unknown,
  source: string,
): Result<string, string> {
  if (!isStringArray(value)) {
    return fail(
      `${source} must be a list of arguments, but it is ${describeValue(value)}.`,
    );
  }
  try {
    const { values } = parseArgs({
      args: value,
      options: { repository: { type: "string" } },
    });
    const repository = values.repository;
    return repository === undefined || repository === ""
      ? fail(
          `--repository must name the repository that the guide clones, but it is ${describeValue(repository)}.`,
        )
      : succeed(repository);
  } catch (error) {
    return fail(
      `${source} must hold only the option --repository, but it is ${describeValue(value)}. Node reported: ${errorMessage(error)}`,
    );
  }
}

function touchesDeployment(files: readonly ChangedFile[]): boolean {
  return files.some(({ path }) =>
    deploymentPaths.some((deploymentPath) =>
      deploymentPath.endsWith("/")
        ? path.startsWith(deploymentPath)
        : path === deploymentPath,
    ),
  );
}

/** Reads the blocks of commands of the guide that run on the server, in order, with the commands for the test machine in place of the examples. It fails for a block of a kind that the test does not know, which it would otherwise skip, for a block that does not end, for a guide without a block for the server, and for an example that no block for the server holds. */
export function parseServerBlocks(
  value: unknown,
  source: string,
  repository: string,
): Result<ServerBlock[], string> {
  if (typeof value !== "string") {
    return fail(
      `${source} must be the text of the guide, but it is ${describeValue(value)}.`,
    );
  }
  const blocks = readBlocks(value, source);
  if (!blocks.ok) {
    return blocks;
  }
  const serverBlocks = blocks.value.filter(({ kind }) => kind === "sh");
  if (serverBlocks.length === 0) {
    return fail(
      `${source} must have a block of commands marked sh, but it has none, so the test would run nothing.`,
    );
  }
  const replacements: [string, string][] = [
    [exampleDomain, testDomain],
    [exampleRepository, repository],
    [exampleBackupDate, "$(date -I)"],
  ];
  const missing = replacements
    .map(([example]) => example)
    .filter((example) =>
      serverBlocks.every(({ commands }) => !commands.includes(example)),
    );
  if (missing.length > 0) {
    return fail(
      `${source} must hold each example that the test replaces in a block marked sh, but no such block holds ${listOfWords(
        missing.map((example) => `"${example}"`),
        "disjunction",
      )}.`,
    );
  }
  return succeed(
    serverBlocks.map(({ section, commands }) => {
      let replaced = commands;
      for (const [example, replacement] of replacements) {
        replaced = replaced.replaceAll(example, replacement);
      }
      return { section, commands: replaced };
    }),
  );
}

/** Reads the name and the version of the system from the text of /etc/os-release. */
export function parseSystemRelease(
  value: unknown,
  source: string,
): Result<SystemRelease, string> {
  if (typeof value !== "string") {
    return fail(
      `${source} must be the text of an os-release file, but it is ${describeValue(value)}.`,
    );
  }
  const name = releaseField(value, "NAME");
  const version = releaseField(value, "VERSION_ID");
  if (name === undefined || version === undefined) {
    const missing = name === undefined ? ["NAME"] : [];
    if (version === undefined) {
      missing.push("VERSION_ID");
    }
    return fail(
      `${source} must name the system in NAME and its version in VERSION_ID, but it has no ${listOfWords(missing)}.`,
    );
  }
  return succeed({ name, version });
}

/** Fails when the guide does not name the system of the test machine, such as Ubuntu 24.04, so that the guide lists every system that the test follows it on. */
export function checkSystemNamed(
  guide: string,
  system: SystemRelease,
): Result<undefined, string> {
  const named = `${system.name} ${system.version}`;
  return guide.includes(named)
    ? succeed(undefined)
    : fail(
        `${guidePath} must name ${named}, because the test follows it on that system, but it does not.`,
      );
}

interface GuideBlock {
  kind: BlockKind;
  section: string;
  commands: string;
}

// A fence may be indented, such as in a list, and the lines of its block then lose that indentation, as Markdown reads them.
function readBlocks(
  text: string,
  source: string,
): Result<GuideBlock[], string> {
  const blocks: GuideBlock[] = [];
  let section = "the start";
  let open:
    | { kind: BlockKind; indentation: number; line: number; lines: string[] }
    | undefined;
  for (const [index, line] of text.split("\n").entries()) {
    const trimmed = line.trimStart();
    const indentation = line.length - trimmed.length;
    const lineNumber = index + 1;
    if (open !== undefined) {
      if (trimmed.trimEnd() === "```") {
        blocks.push({
          kind: open.kind,
          section,
          commands: open.lines.join("\n"),
        });
        open = undefined;
      } else {
        open.lines.push(line.slice(Math.min(open.indentation, indentation)));
      }
      continue;
    }
    if (trimmed.startsWith("~~~")) {
      return fail(
        `${source} must fence each block with backticks, but line ${String(lineNumber)} uses tildes.`,
      );
    }
    if (trimmed.startsWith("```")) {
      const kind = blockKinds.find(
        (candidate) => trimmed === `\`\`\`${candidate}`,
      );
      if (kind === undefined) {
        return fail(
          `${source} must mark each block as sh for the server or as text for the computer of the reader, but line ${String(lineNumber)} is ${describeValue(trimmed)}.`,
        );
      }
      open = { kind, indentation, line: lineNumber, lines: [] };
    } else if (/^#{1,6}\s/.test(trimmed)) {
      section = trimmed.replace(/^#+\s+/, "").trimEnd();
    }
  }
  if (open !== undefined) {
    return fail(
      `${source} must end each block, but the block from line ${String(open.line)} does not end.`,
    );
  }
  return succeed(blocks);
}

function releaseField(text: string, field: string): string | undefined {
  for (const line of text.split("\n")) {
    const match = new RegExp(`^${field}=(?:"([^"]*)"|(\\S*))$`).exec(line);
    if (match !== null) {
      return match[1] ?? match[2];
    }
  }
  return undefined;
}
