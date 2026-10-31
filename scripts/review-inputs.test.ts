import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import { isRecord, isStringArray, readJsonFile } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import {
  chooseLenses,
  hasCancelledJob,
  parseAgentTools,
  parseJobResults,
  parseLensNames,
  parseLensReport,
  parsePullRequestNumber,
  parseRouteSchemaLenses,
  parseRouterChoice,
  parseVerifiedFindings,
  verdictStatuses,
} from "./review-inputs.ts";

const finding = {
  id: "craft-1",
  lens: "craft",
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: ["app/routes.ts:3"],
  rootCause: "The root cause.",
};
const verdict = {
  ...finding,
  status: "confirmed",
  duplicateOf: "",
  evidence: "The evidence.",
};

function lensReport(findings: unknown[]): unknown {
  return { lens: "craft", findings, candidateStandards: [] };
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

test("names the source and the field when a lens finding is invalid", () => {
  expect(
    parseLensReport(
      lensReport([finding, withoutField(finding, "claim")]),
      "findings-craft.json",
    ),
  ).toEqual({
    ok: false,
    failure: 'findings-craft.json: finding 2 has no valid "claim".',
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

test("rejects a lens finding that lacks any field its schema requires", () => {
  const complete = { ...finding };
  expect(
    parseLensReport(lensReport([complete]), "findings-craft.json").ok,
  ).toBe(true);
  for (const field of schemaStrings(lensReportSchema, [
    "properties",
    "findings",
    "items",
    "required",
  ])) {
    const incomplete = withoutField(complete, field);
    expect(
      parseLensReport(lensReport([incomplete]), "findings-craft.json").ok,
      field,
    ).toBe(false);
  }
});

test("rejects a candidate standard that lacks any field its schema requires", () => {
  const complete = { standard: "The standard.", incident: "The incident." };
  const report = (candidate: unknown): unknown => ({
    lens: "craft",
    findings: [],
    candidateStandards: [candidate],
  });
  expect(parseLensReport(report(complete), "findings-craft.json").ok).toBe(
    true,
  );
  for (const field of schemaStrings(lensReportSchema, [
    "properties",
    "candidateStandards",
    "items",
    "required",
  ])) {
    expect(
      parseLensReport(
        report(withoutField(complete, field)),
        "findings-craft.json",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a verdict that lacks any field its schema requires", () => {
  const complete = { ...verdict };
  expect(
    parseVerifiedFindings({ findings: [complete] }, "verified.json").ok,
  ).toBe(true);
  for (const field of schemaStrings(verifiedFindingsSchema, [
    "properties",
    "findings",
    "items",
    "required",
  ])) {
    expect(
      parseVerifiedFindings(
        { findings: [withoutField(complete, field)] },
        "verified.json",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("accepts exactly the statuses that the verifier's schema allows", () => {
  expect([...verdictStatuses].sort()).toEqual(
    schemaStrings(verifiedFindingsSchema, [
      "properties",
      "findings",
      "items",
      "properties",
      "status",
      "enum",
    ]).sort(),
  );
});

const lensReportSchema = ".github/review/lens-report.schema.json";
const verifiedFindingsSchema = ".github/review/verified-findings.schema.json";

/** Reads the list of strings at a path of keys in a schema in .github/review. */
function schemaStrings(schemaPath: string, keys: readonly string[]): string[] {
  const strings = readJsonFile(schemaPath, (schema, source) => {
    let value = schema;
    for (const key of keys) {
      value = isRecord(value) ? value[key] : undefined;
    }
    return isStringArray(value) && value.length > 0
      ? succeed(value)
      : fail(`${source} has no list of strings at ${keys.join(".")}.`);
  });
  if (!strings.ok) {
    throw new Error(strings.failure);
  }
  return strings.value;
}

function withoutField(
  value: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== field),
  );
}

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

test("names exactly the lenses that .claude/agents defines in the router's schema", () => {
  const lensFiles = readdirSync(".claude/agents")
    .filter(
      (file) => file.startsWith("review-") && file !== "review-verifier.md",
    )
    .map((file) => file.replace(/^review-/, "").replace(/\.md$/, ""))
    .sort();
  expect([...routeSchemaLenses()].sort()).toEqual(lensFiles);
});

function routeSchemaLenses(): string[] {
  const lenses = readJsonFile(
    ".github/review/route.schema.json",
    parseRouteSchemaLenses,
  );
  if (!lenses.ok) {
    throw new Error(lenses.failure);
  }
  return lenses.value;
}
