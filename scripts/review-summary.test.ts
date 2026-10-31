import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import {
  lensFindingFields,
  parseJobResults,
  parseLensReport,
  parseVerifiedFindings,
  summarizeReview,
  verifiedFindingFields,
} from "./review-summary.ts";
import type { LensReport, VerifiedFinding } from "./review-summary.ts";

const finishedJobs = { route: "success", lens: "success", verify: "success" };
const finding = {
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: [],
  rootCause: "",
};
const reportWithOneFinding: LensReport = {
  lens: "craft",
  findings: [finding],
  candidateStandards: [],
};

function verified(status: VerifiedFinding["status"]): VerifiedFinding {
  return { ...finding, lens: "craft", status, evidence: "The evidence." };
}

test("passes when every job finished and nothing was confirmed", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [reportWithOneFinding],
    verifiedFindings: [verified("refuted")],
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
    reports: [reportWithOneFinding],
    verifiedFindings: [verified("confirmed")],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe("1 verified finding remains.");
});

test("fails when the verifier leaves a finding out", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [reportWithOneFinding],
    verifiedFindings: [],
    inputProblems: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toContain("some findings were never verified");
});

test("fails when an input could not be read", () => {
  const outcome = summarizeReview({
    jobResults: finishedJobs,
    reports: [],
    verifiedFindings: [],
    inputProblems: ["The craft lens report is not valid JSON."],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe("The craft lens report is not valid JSON.");
});

test("rejects a lens report with a finding that lacks fields", () => {
  const result = parseLensReport({
    lens: "craft",
    findings: [{ location: "app/root.tsx:12" }],
    candidateStandards: [],
  });
  expect(result.ok).toBe(false);
});

test("rejects a verified finding with an unknown status", () => {
  const result = parseVerifiedFindings({
    findings: [{ ...verified("confirmed"), status: "probably" }],
  });
  expect(result.ok).toBe(false);
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

test("parses exactly the fields that the schemas require", () => {
  const lensSchema = JSON.parse(
    readFileSync(".github/review/lens-report.schema.json", "utf8"),
  ) as { properties: { findings: { items: { required: string[] } } } };
  const verifiedSchema = JSON.parse(
    readFileSync(".github/review/verified-findings.schema.json", "utf8"),
  ) as { properties: { findings: { items: { required: string[] } } } };
  expect(lensSchema.properties.findings.items.required).toEqual([
    ...lensFindingFields,
  ]);
  expect(verifiedSchema.properties.findings.items.required).toEqual([
    ...verifiedFindingFields,
  ]);
});
