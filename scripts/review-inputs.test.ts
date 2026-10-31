import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { readJsonFile } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import {
  chooseLenses,
  hasCancelledJob,
  parseAgentTools,
  parseJobResults,
  parseLensName,
  parseLensNames,
  parsePullRequestNumber,
  parseRouterChoice,
  parseVerifiedFindings,
} from "./review-inputs.ts";
import { parseRouteSchemaLenses, reviewSchemaPaths } from "./review-schemas.ts";

const verdict = {
  id: "craft-1",
  lens: "craft",
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: ["app/routes.ts:3"],
  rootCause: "The root cause.",
  status: "confirmed",
  duplicateOf: "",
  evidence: "The evidence.",
};

function routeSchemaLenses(): string[] {
  const lenses = readJsonFile(reviewSchemaPaths.route, parseRouteSchemaLenses);
  if (!lenses.ok) {
    throw new Error(lenses.failure);
  }
  return lenses.value;
}

test("reads job results and refuses an empty needs context", () => {
  expect(
    parseJobResults(
      { route: { result: "success" }, lens: { result: "failure" } },
      "PANEL_RESULTS",
    ),
  ).toEqual({ ok: true, value: { route: "success", lens: "failure" } });
  expect(parseJobResults({}, "PANEL_RESULTS")).toEqual({
    ok: false,
    failure: "PANEL_RESULTS names no jobs, so the panel cannot be judged.",
  });
});

test("names the job when its result is missing", () => {
  expect(
    parseJobResults(
      { route: { result: "success" }, lens: {} },
      "PANEL_RESULTS",
    ),
  ).toEqual({
    ok: false,
    failure: 'PANEL_RESULTS: job lens has no valid "result".',
  });
});

test("names the source and the field when a verdict is invalid", () => {
  expect(
    parseVerifiedFindings(
      { findings: [{ ...verdict, status: "probably" }] },
      "verified.json",
    ),
  ).toEqual({
    ok: false,
    failure: 'verified.json: finding 1 has no valid "status".',
  });
});

test("accepts a pull request number and rejects anything else", () => {
  expect(parsePullRequestNumber("12", "PULL_REQUEST")).toEqual({
    ok: true,
    value: "12",
  });
  expect(parsePullRequestNumber("", "PULL_REQUEST")).toEqual({
    ok: false,
    failure: 'PULL_REQUEST must be a pull request number, but it is "".',
  });
});

test("reads a list of lens names and rejects a value that is not a list", () => {
  expect(parseLensNames(["craft", "docs"], "EXPECTED_LENSES")).toEqual({
    ok: true,
    value: ["craft", "docs"],
  });
  expect(parseLensNames("craft", "EXPECTED_LENSES")).toEqual({
    ok: false,
    failure: "EXPECTED_LENSES must be a JSON list of lens names.",
  });
});

test("accepts the name of a lens of the panel and rejects any other", () => {
  expect(parseLensName("craft", "LENS", ["craft", "docs"])).toEqual({
    ok: true,
    value: "craft",
  });
  expect(parseLensName("style", "LENS", ["craft", "docs"])).toEqual({
    ok: false,
    failure: 'LENS must be one of craft or docs, but it is "style".',
  });
});

test("notices a cancelled job", () => {
  expect(hasCancelledJob({ route: "success", lens: "cancelled" })).toBe(true);
  expect(hasCancelledJob({ route: "success", lens: "failure" })).toBe(false);
});

test("reads the router's choice and rejects an answer without a list", () => {
  expect(
    parseRouterChoice({ lenses: ["docs", "standards"] }, "ROUTER_OUTPUT"),
  ).toEqual({ ok: true, value: ["docs", "standards"] });
  expect(parseRouterChoice({}, "ROUTER_OUTPUT")).toEqual({
    ok: false,
    failure: 'ROUTER_OUTPUT has no valid "lenses".',
  });
});

test("adds the lenses for every change to the router's choice", () => {
  expect(chooseLenses(["docs", "standards"], routeSchemaLenses())).toEqual({
    ok: true,
    value: ["consistency", "docs", "standards"],
  });
});

test("rejects a router's choice with one unknown lens or several", () => {
  expect(chooseLenses(["style"], routeSchemaLenses())).toEqual({
    ok: false,
    failure: "The router chose an unknown lens: style.",
  });
  expect(chooseLenses(["style", "speed"], routeSchemaLenses())).toEqual({
    ok: false,
    failure: "The router chose unknown lenses: style and speed.",
  });
});

test("reads the tools of every agent definition in the repository", () => {
  for (const file of readdirSync(".claude/agents")) {
    const path = `.claude/agents/${file}`;
    const definition = readTextFile(path);
    expect(
      definition.ok ? parseAgentTools(definition.value, path) : definition,
    ).toEqual({
      ok: true,
      value: "Read,Grep,Glob,Bash",
    });
  }
});

test("rejects an agent definition without a tools line", () => {
  expect(parseAgentTools("---\nname: x\n---", "x.md")).toEqual({
    ok: false,
    failure:
      'x.md must list its tools on one line that starts with "tools: ", separated by commas.',
  });
});
