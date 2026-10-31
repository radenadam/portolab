import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import { isRecord, isStringArray, readJsonFile, readTextFile } from "./json.ts";
import {
  chooseLenses,
  hasCancelledJob,
  parseAgentTools,
  parseExpectedLenses,
  parseJobResults,
  parseLensReport,
  parsePullRequestNumber,
  parseRouteSchemaLenses,
  parseVerifiedFindings,
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
    parseJobResults({
      route: { result: "success" },
      lens: { result: "failure" },
    }),
  ).toEqual({ ok: true, value: { route: "success", lens: "failure" } });
  expect(parseJobResults({})).toEqual({
    ok: false,
    failure: "PANEL_RESULTS names no jobs, so the panel cannot be judged.",
  });
});

test("names the source and the field when a lens finding is invalid", () => {
  const withoutClaim = Object.fromEntries(
    Object.entries(finding).filter(([key]) => key !== "claim"),
  );
  expect(
    parseLensReport(lensReport([finding, withoutClaim]), "findings-craft.json"),
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
  for (const field of requiredFindingFields(
    ".github/review/lens-report.schema.json",
  )) {
    const incomplete = Object.fromEntries(
      Object.entries(complete).filter(([key]) => key !== field),
    );
    expect(
      parseLensReport(lensReport([incomplete]), "findings-craft.json").ok,
      field,
    ).toBe(false);
  }
});

test("rejects a verdict that lacks any field its schema requires", () => {
  const complete = { ...verdict };
  expect(
    parseVerifiedFindings({ findings: [complete] }, "verified.json").ok,
  ).toBe(true);
  for (const field of requiredFindingFields(
    ".github/review/verified-findings.schema.json",
  )) {
    const incomplete = Object.fromEntries(
      Object.entries(complete).filter(([key]) => key !== field),
    );
    expect(
      parseVerifiedFindings({ findings: [incomplete] }, "verified.json").ok,
      field,
    ).toBe(false);
  }
});

/** Reads the fields that a schema in .github/review requires of each finding. */
function requiredFindingFields(schemaPath: string): string[] {
  const required = readJsonFile(schemaPath, (schema, source) => {
    const properties = isRecord(schema) ? schema["properties"] : undefined;
    const findings = isRecord(properties) ? properties["findings"] : undefined;
    const items = isRecord(findings) ? findings["items"] : undefined;
    const fields = isRecord(items) ? items["required"] : undefined;
    return isStringArray(fields) && fields.length > 0
      ? succeed(fields)
      : fail(`${source} does not list the fields of a finding.`);
  });
  if (!required.ok) {
    throw new Error(required.failure);
  }
  return required.value;
}

test("accepts a pull request number and rejects anything else", () => {
  expect(parsePullRequestNumber("12")).toEqual({ ok: true, value: "12" });
  expect(parsePullRequestNumber("")).toEqual({
    ok: false,
    failure: 'PULL_REQUEST must be a pull request number, but it is "".',
  });
});

test("reads the expected lenses and rejects a value that is not a list", () => {
  expect(parseExpectedLenses('["craft","docs"]')).toEqual({
    ok: true,
    value: ["craft", "docs"],
  });
  expect(parseExpectedLenses('"craft"')).toEqual({
    ok: false,
    failure:
      'EXPECTED_LENSES must be a JSON list of lens names, but it is "craft".',
  });
});

test("notices a cancelled job", () => {
  expect(hasCancelledJob({ route: "success", lens: "cancelled" })).toBe(true);
  expect(hasCancelledJob({ route: "success", lens: "failure" })).toBe(false);
});

test("adds the lenses for every change to the router's choice", () => {
  expect(
    chooseLenses('{"lenses":["docs","standards"]}', routeSchemaLenses()),
  ).toEqual({ ok: true, value: ["consistency", "docs", "standards"] });
});

test("rejects a router's choice with an unknown lens or no list", () => {
  expect(chooseLenses('{"lenses":["style"]}', routeSchemaLenses())).toEqual({
    ok: false,
    failure: "The router chose an unknown lens: style.",
  });
  expect(
    chooseLenses('{"lenses":["style","speed"]}', routeSchemaLenses()),
  ).toEqual({
    ok: false,
    failure: "The router chose unknown lenses: style and speed.",
  });
  expect(chooseLenses("{}", routeSchemaLenses())).toEqual({
    ok: false,
    failure: `The router's output has no valid "lenses".`,
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
