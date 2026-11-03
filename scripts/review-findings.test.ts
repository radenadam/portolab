import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { listOfWords } from "../app/sentences.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { parseJsonObject, parseStringsAt, readJsonFile } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
import { parseReviewerReport, parseVerdicts } from "./review-findings.ts";
import { lenses } from "./review-lenses.ts";

// The workflow gives these schemas to the reviewer and the verifier, which answer in their shape.
const findingsSchemaPath = ".github/review/findings.schema.json";
const verdictsSchemaPath = ".github/review/verdicts.schema.json";

const report = {
  findings: [
    {
      lens: "craft",
      location: "app/root.tsx:12",
      claim: "The first claim.",
      basis: "The basis.",
      siblings: [],
      rootCause: "",
      scope: "change",
    },
    {
      lens: "docs",
      location: "README.md:3",
      claim: "The second claim.",
      basis: "The basis.",
      siblings: ["docs/product.md:9"],
      rootCause: "The root cause.",
      scope: "existing",
    },
  ],
  candidateStandards: [
    { standard: "The standard.", incident: "The incident." },
  ],
  readFiles: ["app/root.tsx", "README.md"],
  lensChecks: [{ lens: "craft", checked: "The names and the comments." }],
};

test("names the finding and the field when a lens is not one of the panel", () => {
  expect(
    parseReviewerReport(
      {
        ...report,
        findings: [{ ...report.findings[0], lens: "style" }],
      },
      "REVIEWER_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure:
      'REVIEWER_OUTPUT: finding 1 must have "architecture", "consistency", "craft", "docs", "product", "reliability", or "standards" at lens, but lens is "style".',
  });
});

const finding = {
  lens: "craft",
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: ["app/routes.ts:3"],
  rootCause: "The root cause.",
  scope: "change",
};
const candidate = { standard: "The standard.", incident: "The incident." };
const coverage = { readFiles: [], lensChecks: [] };
const verdict = {
  id: "1.1",
  status: "confirmed",
  scope: "change",
  siblings: ["app/routes.ts:3"],
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

const findingKeys = ["properties", "findings", "items"];
const verdictKeys = ["properties", "verdicts", "items"];

function withoutField(
  value: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== field),
  );
}

test("names exactly the lenses of .claude/agents in the code and in the reviewer's schema", () => {
  const lensFiles = readdirSync(".claude/agents")
    .filter(
      (file) => file.startsWith("review-") && file !== "review-verifier.md",
    )
    .map((file) => file.replace(/^review-/, "").replace(/\.md$/, ""))
    .sort();
  expect([...lenses].sort()).toEqual(lensFiles);
  for (const keys of [
    [...findingKeys, "properties", "lens", "enum"],
    ["properties", "lensChecks", "items", "properties", "lens", "enum"],
  ]) {
    expect(
      schemaStrings(findingsSchemaPath, keys).sort(),
      keys.join("."),
    ).toEqual(lensFiles);
  }
});

test("rejects a reviewer's answer that lacks any field of a finding that its schema requires", () => {
  expect(
    parseReviewerReport(
      { ...coverage, findings: [finding], candidateStandards: [] },
      "REVIEWER_OUTPUT",
    ).ok,
  ).toBe(true);
  for (const field of schemaStrings(findingsSchemaPath, [
    ...findingKeys,
    "required",
  ])) {
    expect(
      parseReviewerReport(
        {
          ...coverage,
          findings: [withoutField(finding, field)],
          candidateStandards: [],
        },
        "REVIEWER_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a reviewer's answer that lacks any field that its schema requires", () => {
  const answer = { ...report };
  for (const field of schemaStrings(findingsSchemaPath, ["required"])) {
    expect(
      parseReviewerReport(withoutField(answer, field), "REVIEWER_OUTPUT").ok,
      field,
    ).toBe(false);
  }
  for (const field of schemaStrings(findingsSchemaPath, [
    "properties",
    "lensChecks",
    "items",
    "required",
  ])) {
    expect(
      parseReviewerReport(
        {
          ...answer,
          lensChecks: [withoutField(answer.lensChecks[0] ?? {}, field)],
        },
        "REVIEWER_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a reviewer's answer that lacks any field of a candidate standard that its schema requires", () => {
  expect(
    parseReviewerReport(
      { ...coverage, findings: [], candidateStandards: [candidate] },
      "REVIEWER_OUTPUT",
    ).ok,
  ).toBe(true);
  for (const field of schemaStrings(findingsSchemaPath, [
    "properties",
    "candidateStandards",
    "items",
    "required",
  ])) {
    expect(
      parseReviewerReport(
        {
          ...coverage,
          findings: [],
          candidateStandards: [withoutField(candidate, field)],
        },
        "REVIEWER_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

test("rejects a verdict that lacks any field its schema requires", () => {
  expect(parseVerdicts({ verdicts: [verdict] }, "VERIFIER_OUTPUT").ok).toBe(
    true,
  );
  for (const field of schemaStrings(verdictsSchemaPath, [
    ...verdictKeys,
    "required",
  ])) {
    expect(
      parseVerdicts(
        { verdicts: [withoutField(verdict, field)] },
        "VERIFIER_OUTPUT",
      ).ok,
      field,
    ).toBe(false);
  }
});

// The failure text lists every value that the parser accepts, so it shows that the parser accepts nothing beyond the schema.
test("accepts exactly the statuses and the scopes that the verifier's schema allows", () => {
  for (const field of ["status", "scope"]) {
    const choices = schemaStrings(verdictsSchemaPath, [
      ...verdictKeys,
      "properties",
      field,
      "enum",
    ]);
    for (const choice of choices) {
      expect(
        parseVerdicts(
          { verdicts: [{ ...verdict, [field]: choice }] },
          "VERIFIER_OUTPUT",
        ).ok,
        choice,
      ).toBe(true);
    }
    expect(
      parseVerdicts(
        { verdicts: [{ ...verdict, [field]: "unsure" }] },
        "VERIFIER_OUTPUT",
      ),
    ).toEqual({
      ok: false,
      failure: `VERIFIER_OUTPUT: verdict 1 must have ${listOfWords(
        choices.map((choice) => `"${choice}"`),
        "disjunction",
      )} at ${field}, but ${field} is "unsure".`,
    });
  }
});

test("accepts exactly the scopes that the reviewer's schema allows", () => {
  const scopes = schemaStrings(findingsSchemaPath, [
    ...findingKeys,
    "properties",
    "scope",
    "enum",
  ]);
  for (const scope of scopes) {
    expect(
      parseReviewerReport(
        {
          ...coverage,
          findings: [{ ...finding, scope }],
          candidateStandards: [],
        },
        "REVIEWER_OUTPUT",
      ).ok,
      scope,
    ).toBe(true);
  }
  expect(
    parseReviewerReport(
      {
        ...coverage,
        findings: [{ ...finding, scope: "nearby" }],
        candidateStandards: [],
      },
      "REVIEWER_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure: `REVIEWER_OUTPUT: finding 1 must have ${listOfWords(
      scopes.map((scope) => `"${scope}"`),
      "disjunction",
    )} at scope, but scope is "nearby".`,
  });
});

test("names the path of keys when a schema has no list there", () => {
  expect(
    parseStringsAt({ properties: {} }, "findings.schema.json", {
      keys: ["properties", "findings", "items"],
      mayBeEmpty: false,
    }),
  ).toEqual({
    ok: false,
    failure:
      "findings.schema.json must have a list of strings that is not empty at properties.findings.items, but properties.findings.items is missing.",
  });
});

test("reads every schema of the review as an object, and the workflow passes each one to its agent", () => {
  const workflow = readTextFile(".github/workflows/review.yml");
  for (const schemaPath of [findingsSchemaPath, verdictsSchemaPath]) {
    expect(readJsonFile(schemaPath, parseJsonObject).ok, schemaPath).toBe(true);
    expect(workflow.ok && workflow.value.includes(schemaPath), schemaPath).toBe(
      true,
    );
  }
});

test("rejects a verdict without evidence and a lens check that says nothing, because empty text passes for work that was not done", () => {
  expect(
    parseVerdicts(
      { verdicts: [{ ...verdict, evidence: "" }] },
      "VERIFIER_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure:
      "VERIFIER_OUTPUT: verdict 1 must have text that is not empty at evidence, but evidence is empty.",
  });
  expect(
    parseReviewerReport(
      { ...report, lensChecks: [{ lens: "craft", checked: " " }] },
      "REVIEWER_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure:
      'REVIEWER_OUTPUT: lens check 1 must have text that is not empty at checked, but checked is " ".',
  });
});
