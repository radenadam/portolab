import { expect, test } from "vitest";
import { isRecord, isStringArray, readJsonFile } from "./json.ts";
import {
  parseJobResults,
  parseLensReport,
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
  const schema = readJsonFile(schemaPath);
  const findings =
    schema.ok && isRecord(schema.value) && isRecord(schema.value["properties"])
      ? schema.value["properties"]["findings"]
      : undefined;
  const items = isRecord(findings) ? findings["items"] : undefined;
  const required = isRecord(items) ? items["required"] : undefined;
  if (!isStringArray(required) || required.length === 0) {
    throw new Error(`${schemaPath} does not list the fields of a finding.`);
  }
  return required;
}
