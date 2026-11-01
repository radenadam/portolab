import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { listOfWords } from "../app/sentences.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { parseJsonObject, parseStringsAt, readJsonFile } from "./json.ts";
import { parseLensOutput } from "./lens-reports.ts";
import { parseVerifiedFindings } from "./review-inputs.ts";
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
  return successValueForTest(
    readJsonFile(schemaPath, (value, source) =>
      parseStringsAt(value, source, { keys, mayBeEmpty: false }),
    ),
    `The schema ${schemaPath} lists strings at ${keys.join(".")}`,
  );
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
  const statuses = schemaStrings(reviewSchemaPaths.verifiedFindings, [
    "properties",
    "findings",
    "items",
    "properties",
    "status",
    "enum",
  ]);
  for (const status of statuses) {
    expect(
      parseVerifiedFindings(
        { findings: [{ ...verdict, status }] },
        "VERIFIER_OUTPUT",
      ).ok,
      status,
    ).toBe(true);
  }
  // The failure text lists every status that the parser accepts, so it shows that the parser accepts no status beyond the schema.
  expect(
    parseVerifiedFindings(
      { findings: [{ ...verdict, status: "unsure" }] },
      "VERIFIER_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure: `VERIFIER_OUTPUT: finding 1 must have ${listOfWords(
      statuses.map((status) => `"${status}"`),
      "disjunction",
    )} at status, but status is "unsure".`,
  });
});

test("names the path of keys when a schema has no list there", () => {
  expect(
    parseStringsAt({ properties: {} }, "route.schema.json", {
      keys: ["properties", "lenses", "items", "enum"],
      mayBeEmpty: false,
    }),
  ).toEqual({
    ok: false,
    failure:
      "route.schema.json must have a list of strings that is not empty at properties.lenses.items.enum, but properties.lenses.items.enum is missing.",
  });
});

test("reads every schema of the review as an object", () => {
  for (const schemaPath of Object.values(reviewSchemaPaths)) {
    expect(readJsonFile(schemaPath, parseJsonObject).ok, schemaPath).toBe(true);
  }
});
