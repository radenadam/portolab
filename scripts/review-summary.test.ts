import { expect, test } from "vitest";
import { isRecord, isStringArray, readJsonFile } from "./json.ts";
import {
  parseJobResults,
  parseLensReport,
  parseVerifiedFindings,
  summarizeReview,
} from "./review-summary.ts";
import type {
  LensReport,
  ReviewInput,
  VerifiedFinding,
} from "./review-summary.ts";

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

function report(lens: string, ...ids: string[]): LensReport {
  return { lens, findings: ids.map(reportedFinding), candidateStandards: [] };
}

/** A review in which every job finished and the craft lens reported the given findings. */
function craftReview(
  ids: string[],
  verifiedFindings: VerifiedFinding[] | undefined,
): ReviewInput {
  return {
    jobResults: finishedJobs,
    expectedLenses: ["craft"],
    reports: [report("craft", ...ids)],
    verifiedFindings,
    inputProblems: [],
  };
}

test("passes when every job finished and nothing was confirmed", () => {
  const outcome = summarizeReview(
    craftReview(["craft-1"], [verdict("craft-1", "refuted")]),
  );
  expect(outcome.passed).toBe(true);
  expect(outcome.verdict).toBe("No verified finding remains.");
  expect(outcome.body).toContain("The verifier refuted 1 finding.");
});

test("fails when a job of the panel did not finish", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
    jobResults: { ...finishedJobs, lens: "failure" },
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The panel did not finish, so this change has not been reviewed. Unfinished jobs: lens.",
  );
});

test("fails with singular and plural wording for confirmed findings", () => {
  expect(
    summarizeReview(craftReview(["craft-1"], [verdict("craft-1", "confirmed")]))
      .verdict,
  ).toBe("1 verified finding remains.");
  expect(
    summarizeReview(
      craftReview(
        ["craft-1", "craft-2"],
        [verdict("craft-1", "confirmed"), verdict("craft-2", "confirmed")],
      ),
    ).verdict,
  ).toBe("2 verified findings remain.");
});

test("fails when a chosen lens sent no report", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
    expectedLenses: ["craft", "docs", "product"],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The panel has no report from the docs and product lenses.",
  );
  expect(
    summarizeReview({ ...craftReview([], []), expectedLenses: ["docs"] })
      .verdict,
  ).toBe("The panel has no report from the docs lens.");
});

test("fails when the verifier's output is missing", () => {
  const outcome = summarizeReview(craftReview(["craft-1"], undefined));
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The verifier's output is missing, so no finding has been verified.",
  );
});

test("fails when the verifier leaves a finding out and repeats another", () => {
  const outcome = summarizeReview(
    craftReview(
      ["craft-1", "craft-2"],
      [verdict("craft-1", "refuted"), verdict("craft-1", "refuted")],
    ),
  );
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The verifier must give exactly one verdict for each reported finding, so its answer cannot be trusted. Missing: craft-2. Unknown: none. Repeated: craft-1.",
  );
});

test("fails when duplicates repeat no confirmed finding, with singular and plural wording", () => {
  expect(
    summarizeReview(
      craftReview(
        ["craft-1", "craft-2"],
        [
          verdict("craft-1", "duplicate", "craft-2"),
          verdict("craft-2", "duplicate", "craft-1"),
        ],
      ),
    ).verdict,
  ).toBe(
    "A duplicate must repeat a confirmed finding, but craft-1 and craft-2 repeat none.",
  );
  expect(
    summarizeReview(
      craftReview(
        ["craft-1", "craft-2"],
        [
          verdict("craft-1", "refuted"),
          verdict("craft-2", "duplicate", "craft-1"),
        ],
      ),
    ).verdict,
  ).toBe(
    "A duplicate must repeat a confirmed finding, but craft-2 repeats none.",
  );
});

test("counts a duplicate of a confirmed finding once", () => {
  const outcome = summarizeReview(
    craftReview(
      ["craft-1", "craft-2"],
      [
        verdict("craft-1", "confirmed"),
        verdict("craft-2", "duplicate", "craft-1"),
      ],
    ),
  );
  expect(outcome.verdict).toBe("1 verified finding remains.");
  expect(outcome.body).toContain(
    "The verifier merged 1 duplicate finding into the findings above.",
  );
});

test("fails when an input could not be read", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
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

test("rejects a lens finding that lacks any field its schema requires", () => {
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

test("rejects a verified finding that lacks any field its schema requires", () => {
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

test("rejects a verified finding with an unknown status", () => {
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
