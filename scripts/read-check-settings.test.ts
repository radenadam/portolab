import { spawnSync } from "node:child_process";
import { expect, test } from "vitest";
import { secondMilliseconds } from "../app/time-units.ts";
import { checkSlotVariable } from "./check-settings.ts";

function runCheckProgram(
  argumentsOfCheck: readonly string[],
  environment: Record<string, string | undefined>,
) {
  const run = spawnSync(process.execPath, argumentsOfCheck, {
    // These checks assert terminal output, so inherited CI annotations and color settings must not change it.
    env: {
      ...process.env,
      GITHUB_ACTIONS: "false",
      NO_COLOR: undefined,
      FORCE_COLOR: "0",
      ...environment,
    },
    encoding: "utf8",
    timeout: 10 * secondMilliseconds,
  });
  expect(run.error).toBeUndefined();
  return run;
}

test(
  "reads the selected check settings at the environment boundary",
  { timeout: 30 * secondMilliseconds },
  () => {
    const run = runCheckProgram(
      [
        "--input-type=module",
        "-e",
        'import { readCheckSettings } from "./scripts/read-check-settings.ts"; process.stdout.write(JSON.stringify(readCheckSettings()));',
      ],
      { [checkSlotVariable]: "2" },
    );
    expect(run.status).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.stdout).toBe(
      '{"browser":4177,"development":4178,"hotReload":24680,"maximumWorkers":"25%"}',
    );
  },
);

test(
  "keeps the default worker pools and shares the slot's worker budget between unit and browser tests",
  { timeout: 60 * secondMilliseconds },
  () => {
    for (const [slot, continuousIntegration, expected] of [
      [undefined, "false", '{"browser":"50%"}'],
      ["0", "true", '{"browser":"100%"}'],
      ["1", "false", '{"unit":"25%","browser":"25%"}'],
      ["2", "true", '{"unit":"25%","browser":"25%"}'],
    ] as const) {
      const run = runCheckProgram(
        [
          "--input-type=module",
          "-e",
          'import unit from "./vitest.config.ts"; import browser from "./playwright.config.ts"; process.stdout.write(JSON.stringify({ unit: unit.test?.maxWorkers, browser: browser.workers }));',
        ],
        {
          [checkSlotVariable]: slot,
          CI: continuousIntegration,
        },
      );
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).toBe(expected);
    }
  },
);

test(
  "keeps check-only settings out of the normal server and reports every invalid startup input",
  { timeout: 30 * secondMilliseconds },
  () => {
    const config = runCheckProgram(
      ["--input-type=module", "-e", 'await import("./vite.config.ts")'],
      { [checkSlotVariable]: "wrong" },
    );
    expect(config.status).toBe(0);
    expect(config.stderr).toBe("");

    const server = runCheckProgram(
      [
        "--conditions",
        "development",
        "server/main.ts",
        "--mode",
        "development",
        "--hot-reload-port",
        "0",
      ],
      {
        [checkSlotVariable]: "wrong",
        PORT: "0",
        PRICE_SOURCE: "wrong",
        DATABASE_PATH: "",
      },
    );
    expect(server.status).toBe(1);
    for (const reason of [
      '--hot-reload-port must be a whole number from 1 to 65535, but it is "0".',
      'PORT must be a whole number from 1 to 65535, but it is "0".',
      'PRICE_SOURCE must be "yahoo" or "fixture", but it is "wrong".',
      "DATABASE_PATH must be the path of a file, but it is empty.",
    ]) {
      expect(server.stderr).toContain(JSON.stringify(reason));
    }
    expect(server.stderr).not.toContain(checkSlotVariable);
  },
);

test(
  "stops each check entry with the parser's reason for a wrong slot",
  { timeout: 60 * secondMilliseconds },
  () => {
    for (const argumentsOfCheck of [
      ["scripts/check-dev-server.ts"],
      ["--input-type=module", "-e", 'await import("./e2e/test-server.ts")'],
      ["--input-type=module", "-e", 'await import("./vitest.config.ts")'],
    ]) {
      const run = runCheckProgram(argumentsOfCheck, {
        [checkSlotVariable]: "wrong",
      });
      expect(run.status).toBe(1);
      expect(run.stderr).toBe(
        'PORTOLAB_CHECK_SLOT must be a whole number from 0 to 99, but it is "wrong".\n',
      );
    }
  },
);
