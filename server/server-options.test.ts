import { expect, test } from "vitest";
import {
  parseCommandLine,
  parseDatabasePath,
  parsePort,
  parsePriceSource,
} from "./server-options.ts";

test("reads the mode from the command line and uses production without it", () => {
  expect(parseCommandLine([], "The command line")).toEqual({
    ok: true,
    value: "production",
  });
  expect(
    parseCommandLine(["--mode", "development"], "The command line"),
  ).toEqual({ ok: true, value: "development" });
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
    /^The command line must hold only the option --mode, but it is \["--bogus"\]\. Node reported: \S/,
  );
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
