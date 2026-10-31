import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  parseLensOutput,
  parseLensReport,
  readLensReports,
  toLensReport,
} from "./lens-reports.ts";

const finding = {
  location: "app/root.tsx:12",
  claim: "The claim.",
  basis: "The basis.",
  siblings: ["app/routes.ts:3"],
  rootCause: "The root cause.",
};

test("gives each finding its lens and an id from its position", () => {
  expect(
    toLensReport("craft", {
      findings: [finding, { ...finding, claim: "Another claim." }],
      candidateStandards: [],
    }),
  ).toEqual({
    lens: "craft",
    findings: [
      { ...finding, id: "craft-1", lens: "craft" },
      { ...finding, claim: "Another claim.", id: "craft-2", lens: "craft" },
    ],
    candidateStandards: [],
  });
});

test("names the source, the position, and the field when a finding of a lens is invalid", () => {
  expect(
    parseLensOutput(
      { findings: [finding, { ...finding, claim: 7 }], candidateStandards: [] },
      "LENS_OUTPUT",
    ),
  ).toEqual({
    ok: false,
    failure: 'LENS_OUTPUT: finding 2 has no valid "claim".',
  });
});

test("rejects a saved report whose finding has no id", () => {
  expect(
    parseLensReport(
      {
        lens: "craft",
        findings: [{ ...finding, lens: "craft" }],
        candidateStandards: [],
      },
      "findings-craft.json",
    ),
  ).toEqual({
    ok: false,
    failure: 'findings-craft.json: finding 1 has no valid "id".',
  });
});

test("reads every report in a directory and names each file that fails", () => {
  const directory = mkdtempSync(join(tmpdir(), "portolab-lens-reports-"));
  const report = toLensReport("craft", {
    findings: [finding],
    candidateStandards: [],
  });
  writeFileSync(join(directory, "findings-craft.json"), JSON.stringify(report));
  writeFileSync(join(directory, "findings-docs.json"), "[]");
  expect(readLensReports(directory)).toEqual({
    reports: [report],
    problems: [
      `${join(directory, "findings-docs.json")} is not a JSON object.`,
    ],
  });
});

test("reads no reports from a directory that does not exist", () => {
  expect(readLensReports(join(tmpdir(), "portolab-missing-reports"))).toEqual({
    reports: [],
    problems: [],
  });
});
