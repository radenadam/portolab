import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { successValueForTest } from "../app/success-value-for-test.ts";
import {
  parseCommandLine,
  parseDatabasePath,
  parsePort,
  parsePriceSource,
  parseCompanyLogosPath,
} from "./server-options.ts";

test("reads the mode from the command line and uses production without it", () => {
  expect(parseCommandLine([], "The command line")).toEqual({
    ok: true,
    value: { mode: "production", hotReloadPort: undefined },
  });
  expect(
    parseCommandLine(["--mode", "development"], "The command line"),
  ).toEqual({
    ok: true,
    value: { mode: "development", hotReloadPort: undefined },
  });
  expect(parseCommandLine(["--mode", "develop"], "The command line")).toEqual({
    ok: false,
    failure:
      '--mode must be "development" or "production", but it is "develop".',
  });
});

test("rejects a command line that is not a list of arguments and quotes it", () => {
  expect(parseCommandLine("--mode", "The command line")).toEqual({
    ok: false,
    failure:
      'The command line must be a list of arguments, but it is "--mode".',
  });
});

test("rejects an unknown option and keeps the reason that Node gives", () => {
  const commandLine = parseCommandLine(["--bogus"], "The command line");
  expect(commandLine.ok ? "" : commandLine.failure).toMatch(
    /^The command line must hold only the options --mode and --hot-reload-port, but it is \["--bogus"\]\. Node reported: \S/,
  );
});

test("reads an explicit WebSocket port and names every wrong command-line value", () => {
  expect(
    parseCommandLine(
      ["--mode", "development", "--hot-reload-port", "24679"],
      "The command line",
    ),
  ).toEqual({
    ok: true,
    value: { mode: "development", hotReloadPort: 24_679 },
  });
  expect(
    parseCommandLine(
      ["--mode", "develop", "--hot-reload-port", "0"],
      "The command line",
    ),
  ).toEqual({
    ok: false,
    failure:
      '--mode must be "development" or "production", but it is "develop".\n--hot-reload-port must be a whole number from 1 to 65535, but it is "0".',
  });
});

test("uses port 3000 without a port", () => {
  expect(parsePort(undefined, "PORT")).toEqual({ ok: true, value: 3000 });
});

test("accepts a port from 1 to 65535 and rejects anything else", () => {
  expect(parsePort("1", "PORT")).toEqual({ ok: true, value: 1 });
  expect(parsePort("65535", "PORT")).toEqual({ ok: true, value: 65_535 });
  expect(parsePort("", "PORT")).toEqual({
    ok: false,
    failure: "PORT must be a whole number from 1 to 65535, but it is empty.",
  });
  for (const value of ["0", "65536", "3000.5", "-1", " 80"]) {
    expect(parsePort(value, "PORT")).toEqual({
      ok: false,
      failure: `PORT must be a whole number from 1 to 65535, but it is "${value}".`,
    });
  }
});

test("uses Yahoo Finance without a price source, and rejects an unknown one", () => {
  expect(parsePriceSource(undefined, "PRICE_SOURCE")).toEqual({
    ok: true,
    value: "yahoo",
  });
  expect(parsePriceSource("fixture", "PRICE_SOURCE")).toEqual({
    ok: true,
    value: "fixture",
  });
  expect(parsePriceSource("google", "PRICE_SOURCE")).toEqual({
    ok: false,
    failure: 'PRICE_SOURCE must be "yahoo" or "fixture", but it is "google".',
  });
});

test("uses the default database file without a path, and rejects an empty one", () => {
  expect(parseDatabasePath(undefined, "DATABASE_PATH")).toEqual({
    ok: true,
    value: "data/portolab.sqlite",
  });
  expect(parseDatabasePath("/srv/portolab.sqlite", "DATABASE_PATH")).toEqual({
    ok: true,
    value: "/srv/portolab.sqlite",
  });
  expect(parseDatabasePath("", "DATABASE_PATH")).toEqual({
    ok: false,
    failure: "DATABASE_PATH must be the path of a file, but it is empty.",
  });
});

/** Reads the table of environment variables in README.md, whose rows name a variable in a code span and its default in a code span, or "none" for a variable without a default. */
function readmeDefaults(): Map<string, string> {
  const defaults = new Map<string, string>();
  for (const line of readFileSync("README.md", "utf8").split("\n")) {
    const [, name, defaultValue] = line.split("|").map((cell) => cell.trim());
    if (name?.startsWith("`") && defaultValue !== undefined) {
      defaults.set(
        name.slice(1, -1),
        defaultValue.startsWith("`") ? defaultValue.slice(1, -1) : defaultValue,
      );
    }
  }
  return defaults;
}

test("lists in README.md each environment variable with the default that its parser uses", () => {
  const parsedDefaults = new Map<string, string>();
  for (const [name, parsed] of [
    ["PORT", parsePort(undefined, "PORT")],
    ["DATABASE_PATH", parseDatabasePath(undefined, "DATABASE_PATH")],
    ["PRICE_SOURCE", parsePriceSource(undefined, "PRICE_SOURCE")],
    [
      "COMPANY_LOGOS_PATH",
      parseCompanyLogosPath(undefined, "COMPANY_LOGOS_PATH"),
    ],
  ] as const) {
    const value = successValueForTest<number | string | undefined, string>(
      parsed,
      `The default of ${name} is valid`,
    );
    parsedDefaults.set(name, value === undefined ? "none" : String(value));
  }
  expect(readmeDefaults()).toEqual(parsedDefaults);
});

test("keeps company logos optional and rejects an empty folder path", () => {
  expect(parseCompanyLogosPath(undefined, "COMPANY_LOGOS_PATH")).toEqual({
    ok: true,
    value: undefined,
  });
  expect(
    parseCompanyLogosPath("/srv/company-logos", "COMPANY_LOGOS_PATH"),
  ).toEqual({ ok: true, value: "/srv/company-logos" });
  expect(parseCompanyLogosPath("", "COMPANY_LOGOS_PATH")).toEqual({
    ok: false,
    failure:
      "COMPANY_LOGOS_PATH must be the path of a folder, but it is empty.",
  });
});
