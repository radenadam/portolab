import { expect, test } from "vitest";
import type { LensReport } from "./lens-reports.ts";
import type { VerifiedFinding } from "./review-inputs.ts";
import { summarizeReview } from "./summarize-review.ts";
import type { ReviewInput } from "./summarize-review.ts";

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
});

test("fails when a job of the panel did not finish", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
    jobResults: { ...finishedJobs, lens: "failure" },
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The lens job of the panel did not finish, so this change has not been reviewed.",
  );
  expect(
    summarizeReview({
      ...craftReview([], []),
      jobResults: { route: "success", lens: "failure", verify: "skipped" },
    }).verdict,
  ).toBe(
    "The lens and verify jobs of the panel did not finish, so this change has not been reviewed.",
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
  expect(
    summarizeReview({
      ...craftReview([], []),
      expectedLenses: ["craft", "docs", "product"],
    }).verdict,
  ).toBe("The panel has no report from the docs and product lenses.");
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

test("fails when an input could not be read", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
    inputProblems: ['findings-craft.json: finding 1 has no valid "claim".'],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    'findings-craft.json: finding 1 has no valid "claim".',
  );
});

test("reports every input that could not be read", () => {
  const outcome = summarizeReview({
    ...craftReview([], []),
    inputProblems: [
      "EXPECTED_LENSES is empty or not set, so it holds no JSON.",
      "review/verified.json is not a JSON object.",
    ],
  });
  expect(outcome.verdict).toBe(
    "EXPECTED_LENSES is empty or not set, so it holds no JSON. review/verified.json is not a JSON object.",
  );
  expect(outcome.body).toContain(outcome.verdict);
});

test("reports refuted and duplicate findings in the singular and the plural", () => {
  const singular = summarizeReview(
    craftReview(
      ["craft-1", "craft-2", "craft-3"],
      [
        verdict("craft-1", "confirmed"),
        verdict("craft-2", "refuted"),
        verdict("craft-3", "duplicate", "craft-1"),
      ],
    ),
  ).body;
  expect(singular).toContain("The verifier refuted 1 finding.");
  expect(singular).toContain(
    "The verifier merged 1 duplicate finding into the finding above.",
  );
  const plural = summarizeReview(
    craftReview(
      ["craft-1", "craft-2", "craft-3", "craft-4", "craft-5", "craft-6"],
      [
        verdict("craft-1", "confirmed"),
        verdict("craft-2", "refuted"),
        verdict("craft-3", "refuted"),
        verdict("craft-4", "duplicate", "craft-1"),
        verdict("craft-5", "duplicate", "craft-6"),
        verdict("craft-6", "confirmed"),
      ],
    ),
  ).body;
  expect(plural).toContain("The verifier refuted 2 findings.");
  expect(plural).toContain(
    "The verifier merged 2 duplicate findings into the findings above.",
  );
});

test("lists each verified finding with its basis, evidence, siblings, and root cause", () => {
  const body = summarizeReview(
    craftReview(
      ["craft-1"],
      [
        {
          ...verdict("craft-1", "confirmed"),
          siblings: ["app/routes.ts:3", "app/root.tsx:20"],
          rootCause: "The root cause.",
        },
      ],
    ),
  ).body;
  expect(body).toContain(
    [
      "### Verified findings",
      "",
      "1. `app/root.tsx:12` (craft): The claim.",
      "   - Basis: The basis.",
      "   - Evidence: The evidence.",
      "   - Siblings: app/routes.ts:3, app/root.tsx:20",
      "   - Root cause: The root cause.",
    ].join("\n"),
  );
});

test("lists each candidate standard with its lens and its incident", () => {
  const body = summarizeReview({
    ...craftReview([], []),
    reports: [
      {
        lens: "craft",
        findings: [],
        candidateStandards: [
          { standard: "A standard.", incident: "An incident." },
        ],
      },
    ],
  }).body;
  expect(body).toContain(
    [
      "### Candidate standards",
      "",
      "- A standard. Suggested by the craft lens, because of this incident: An incident.",
    ].join("\n"),
  );
});
