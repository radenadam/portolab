import { expect, test } from "vitest";
import { readJsonFile, parseStringsAt } from "./json.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { fixCheckProblem, parseFixChecks } from "./review-fix-checks.ts";
import type { FixCheck } from "./review-fix-checks.ts";

const fix: FixCheck = {
  file: "fix.ts",
  status: "fix",
  evidence: "Fixes finding 3.1.",
};

test("requires every field and status from the verifier schema with nonempty evidence", () => {
  const schema = ".github/review/verdicts.schema.json";
  const keys = ["properties", "fixChecks", "items"];
  const fields = successValueForTest(
    readJsonFile(schema, (value, source) =>
      parseStringsAt(value, source, {
        keys: [...keys, "required"],
        mayBeEmpty: false,
      }),
    ),
    "The fix-check schema has required fields",
  );
  expect(parseFixChecks({ fixChecks: [fix] }, "answer")).toEqual({
    ok: true,
    value: [fix],
  });
  for (const field of fields) {
    for (const value of [undefined, "", 4]) {
      expect(
        parseFixChecks({ fixChecks: [{ ...fix, [field]: value }] }, "answer")
          .ok,
      ).toBe(false);
    }
  }
  const statuses = successValueForTest(
    readJsonFile(schema, (value, source) =>
      parseStringsAt(value, source, {
        keys: [...keys, "properties", "status", "enum"],
        mayBeEmpty: false,
      }),
    ),
    "The fix-check schema lists its statuses",
  );
  for (const status of statuses) {
    expect(
      parseFixChecks({ fixChecks: [{ ...fix, status }] }, "answer").ok,
    ).toBe(true);
  }
  expect(
    parseFixChecks({ fixChecks: [{ ...fix, status: "unknown" }] }, "answer").ok,
  ).toBe(false);
  for (const value of [
    undefined,
    {},
    { fixChecks: "fix.ts" },
    { fixChecks: [null] },
  ]) {
    expect(parseFixChecks(value, "answer").ok).toBe(false);
  }
});

test("accepts only complete accounts of finding fixes and refuses unrelated author work", () => {
  expect(fixCheckProblem([], undefined)).toBeUndefined();
  expect(fixCheckProblem([fix.file], [fix])).toBeUndefined();
  expect(fixCheckProblem([fix.file], undefined)).toBe(
    "The verifier's checks of the author files are missing, so the finding-check allowance cannot accept this push.",
  );
  for (const checks of [[], [fix, fix], [{ ...fix, file: "other.ts" }]]) {
    expect(fixCheckProblem([fix.file], checks)).toContain(
      "must account for each author file exactly once",
    );
  }
  expect(fixCheckProblem([fix.file], [{ ...fix, status: "unrelated" }])).toBe(
    "The finding-check allowance permits only fixes of open findings. fix.ts: Fixes finding 3.1.",
  );
});
