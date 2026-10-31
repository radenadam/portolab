import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { parseJsonObject, parseStringsAt, readJsonFile } from "./json.ts";
import { parseLensOutput } from "./lens-reports.ts";
import { parseVerifiedFindings, verdictStatuses } from "./review-inputs.ts";
import { parseRouteSchemaLenses, reviewSchemaPaths } from "./review-schemas.ts";

const finding = {
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: ["app/routes.ts:3"],
  rootCause: "The root cause.",
};
const candidate = { standard: "The standard.", incident: "The incident." };
const verdict = {
  ...finding,
  id: "craft-1",
  lens: "craft",
  status: "confirmed",
  duplicateOf: "",
  evidence: "The evidence.",
};

/** Reads the list of strings at a path of keys in one of the schemas, which a test needs to compare against. */
function schemaStrings(schemaPath: string, keys: readonly string[]): string[] {
  const strings = readJsonFile(schemaPath, (value, source) =>
    parseStringsAt(value, source, keys),
  );
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

test("names exactly the lenses that .claude/agents defines in the router's schema", () => {
  const lensFiles = readdirSync(".claude/agents")
    .filter(
      (file) => file.startsWith("review-") && file !== "review-verifier.md",
    )
    .map((file) => file.replace(/^review-/, "").replace(/\.md$/, ""))
    .sort();
  const schemaLenses = readJsonFile(
    reviewSchemaPaths.route,
    parseRouteSchemaLenses,
  );
  expect(schemaLenses.ok && [...schemaLenses.value].sort()).toEqual(lensFiles);
});

test("rejects a lens answer that lacks any field of a finding that its schema requires", () => {
  expect(
    parseLensOutput(
      { findings: [finding], candidateStandards: [] },
      "LENS_OUTPUT",
    ).ok,
  ).toBe(true);
  for (const field of schemaStrings(reviewSchemaPaths.lensReport, [
    "properties",
    "findings",
    "items",
    "required",
  ])) {
    expect(
      parseLensOutput(
        { findings: [withoutField(finding, field)], candidateStandards: [] },
        "LENS_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a lens answer that lacks any field of a candidate standard that its schema requires", () => {
  expect(
    parseLensOutput(
      { findings: [], candidateStandards: [candidate] },
      "LENS_OUTPUT",
    ).ok,
  ).toBe(true);
  for (const field of schemaStrings(reviewSchemaPaths.lensReport, [
    "properties",
    "candidateStandards",
    "items",
    "required",
  ])) {
    expect(
      parseLensOutput(
        { findings: [], candidateStandards: [withoutField(candidate, field)] },
        "LENS_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a verdict that lacks any field its schema requires", () => {
  expect(
    parseVerifiedFindings({ findings: [verdict] }, "VERIFIER_OUTPUT").ok,
  ).toBe(true);
  for (const field of schemaStrings(reviewSchemaPaths.verifiedFindings, [
    "properties",
    "findings",
    "items",
    "required",
  ])) {
    expect(
      parseVerifiedFindings(
        { findings: [withoutField(verdict, field)] },
        "VERIFIER_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("accepts exactly the statuses that the verifier's schema allows", () => {
  expect([...verdictStatuses].sort()).toEqual(
    schemaStrings(reviewSchemaPaths.verifiedFindings, [
      "properties",
      "findings",
      "items",
      "properties",
      "status",
      "enum",
    ]).sort(),
  );
});

test("names the path of keys when a schema has no list there", () => {
  expect(
    parseStringsAt({ properties: {} }, "route.schema.json", [
      "properties",
      "lenses",
      "items",
      "enum",
    ]),
  ).toEqual({
    ok: false,
    failure:
      "route.schema.json has no list of strings at properties.lenses.items.enum.",
  });
});

test("reads every schema of the review as an object", () => {
  for (const schemaPath of Object.values(reviewSchemaPaths)) {
    expect(readJsonFile(schemaPath, parseJsonObject).ok, schemaPath).toBe(true);
  }
});
