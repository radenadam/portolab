import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import {
  parseLensOutput,
  readLensReports,
  toLensReport,
} from "./lens-reports.ts";

/** Creates an empty folder for one test, and removes it when the test finishes. */
function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "portolab-lens-reports-"));
  onTestFinished(() => {
    rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

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
    failure:
      "LENS_OUTPUT: finding 2 must have a string at claim, but claim is 7.",
  });
});

test("rejects a saved report whose finding has no id", () => {
  const directory = temporaryDirectory();
  const path = join(directory, "findings-craft.json");
  writeFileSync(
    path,
    JSON.stringify({
      lens: "craft",
      findings: [{ ...finding, lens: "craft" }],
      candidateStandards: [],
    }),
  );
  expect(readLensReports(directory)).toEqual({
    reports: [],
    problems: [
      `${path}: finding 1 must have a string at id, but id is missing.`,
    ],
  });
});

test("reads every report in a directory and names each file that fails", () => {
  const directory = temporaryDirectory();
  const report = toLensReport("craft", {
    findings: [finding],
    candidateStandards: [],
  });
  writeFileSync(join(directory, "findings-craft.json"), JSON.stringify(report));
  writeFileSync(join(directory, "findings-docs.json"), "[]");
  expect(readLensReports(directory)).toEqual({
    reports: [report],
    problems: [
      `${join(directory, "findings-docs.json")} must be a JSON object, but it is [].`,
    ],
  });
});

test("reads no reports from a directory that does not exist", () => {
  expect(readLensReports(join(tmpdir(), "portolab-missing-reports"))).toEqual({
    reports: [],
    problems: [],
  });
});
