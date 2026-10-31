import { expect, test } from "vitest";
import { isRecord, isStringArray, readJsonFile } from "./json.ts";
import {
  parseJobResults,
  parseLensReport,
  parseVerifiedFindings,
  summarizeReview,
} from "./review-summary.ts";
import type { LensReport, VerifiedFinding } from "./review-summary.ts";

const finishedJobs = { route: "success", lens: "success", verify: "success" };

function reportedFinding(id: string): LensReport["findings"][number] {
  return {
    id,
    lens: "craft",
    location: "app/root.tsx:12",
    claim: "The claim.",
    basis: "The basis.",
    siblings: [],
    rootCause: "",
  };
}

function verdict(
  id: string,
  status: VerifiedFinding["status"],
  duplicateOf = "",
): VerifiedFinding {
  return {
    ...reportedFinding(id),
    status,
    duplicateOf,
    evidence: "The evidence.",
  };
}

function report(...ids: string[]): LensReport {
  return {
    lens: "craft",
    findings: ids.map(reportedFinding),
    candidateStandards: [],
  };
}

test("passes when every job finished and nothing was confirmed", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [report("craft-1")],
    verifiedFindings: [verdict("craft-1", "refuted")],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(true);
  expect(outcome.body).toContain("**Passed.** No verified finding remains.");
  expect(outcome.body).toContain("The verifier refuted 1 finding.");
});

test("fails when a job of the panel did not finish", () => {
  const outcome = summarizeReview({
    jobResults: { ...finishedJobs, lens: "failure" },
    reports: [],
    verifiedFindings: undefined,
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toContain("Unfinished jobs: lens.");
});

test("fails with singular wording when one finding is confirmed", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [report("craft-1")],
    verifiedFindings: [verdict("craft-1", "confirmed")],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe("1 verified finding remains.");
});

test("fails when the verifier leaves a finding out and repeats another", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [report("craft-1", "craft-2")],
    verifiedFindings: [
      verdict("craft-1", "refuted"),
      verdict("craft-1", "refuted"),
    ],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toContain("Missing: craft-2.");
  expect(outcome.verdict).toContain("Repeated: craft-1.");
});

test("fails when every finding is marked as a duplicate of another", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [report("craft-1", "craft-2")],
    verifiedFindings: [
      verdict("craft-1", "duplicate", "craft-2"),
      verdict("craft-2", "duplicate", "craft-1"),
    ],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toContain(
    "A duplicate must repeat a confirmed finding",
  );
});

test("counts a duplicate of a confirmed finding once", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [report("craft-1", "craft-2")],
    verifiedFindings: [
      verdict("craft-1", "confirmed"),
      verdict("craft-2", "duplicate", "craft-1"),
    ],
    inputProblems: [],
  });
  expect(outcome.verdict).toBe("1 verified finding remains.");
  expect(outcome.body).toContain(
    "The verifier merged 1 duplicate finding into the findings above.",
  );
});

test("fails when an input could not be read", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [],
    verifiedFindings: [],
    inputProblems: ["findings-craft.json is not valid JSON."],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe("findings-craft.json is not valid JSON.");
});

test("reads job results and refuses an empty needs context", () => {
  expect(
    parseJobResults({
      route: { result: "success" },
      lens: { result: "failure" },
    }),
  ).toEqual({ ok: true, value: { route: "success", lens: "failure" } });
  expect(parseJobResults({}).ok).toBe(false);
});

test("the lens report parser rejects a finding without any field that its schema requires", () => {
  const complete = { ...reportedFinding("craft-1") };
  const wrap = (finding: object): unknown => ({
    lens: "craft",
    findings: [finding],
    candidateStandards: [],
  });
  expect(parseLensReport(wrap(complete)).ok).toBe(true);
  for (const field of requiredFindingFields(
    ".github/review/lens-report.schema.json",
  )) {
    const incomplete = Object.fromEntries(
      Object.entries(complete).filter(([key]) => key !== field),
    );
    expect(parseLensReport(wrap(incomplete)).ok, field).toBe(false);
  }
});

test("the verifier parser rejects a finding without any field that its schema requires", () => {
  const complete = { ...verdict("craft-1", "confirmed") };
  expect(parseVerifiedFindings({ findings: [complete] }).ok).toBe(true);
  for (const field of requiredFindingFields(
    ".github/review/verified-findings.schema.json",
  )) {
    const incomplete = Object.fromEntries(
      Object.entries(complete).filter(([key]) => key !== field),
    );
    expect(parseVerifiedFindings({ findings: [incomplete] }).ok, field).toBe(
      false,
    );
  }
});

test("the verifier parser rejects an unknown status", () => {
  const result = parseVerifiedFindings({
    findings: [{ ...verdict("craft-1", "confirmed"), status: "probably" }],
  });
  expect(result.ok).toBe(false);
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
