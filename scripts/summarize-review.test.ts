import { expect, test } from "vitest";
import type { Finding, Verdict } from "./review-findings.ts";
import type { ChangedFile } from "./review-lenses.ts";
import {
  checkRoundLimit,
  planReview,
  reviewRoundLimit,
} from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import { parseLatestReviewState } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import type { ReviewInput } from "./judge-review.ts";
import { outsideIssue, summarizeReview } from "./summarize-review.ts";

// planReview takes the state that parseLatestReviewState reads, which holds no round before any review carries a state.
const stateBeforeFirstRound = successValueForTest(
  parseLatestReviewState([], "reviews"),
  "The reviews of a new pull request hold no state",
);

const earlierHead = "1".repeat(40);
const reviewedHead = "2".repeat(40);
const docs: ChangedFile = { path: "docs/product.md", change: "modified" };
const order: ChangedFile = {
  path: "app/features/trading/order.ts",
  change: "modified",
};

function finding(id: string, scope: Finding["scope"] = "change"): Finding {
  return {
    id,
    lens: "docs",
    location: "docs/product.md:3",
    claim: "The claim.",
    basis: "The basis.",
    siblings: [],
    rootCause: "",
    scope,
  };
}

function verdict(
  id: string,
  status: Verdict["status"],
  options: { scope?: Verdict["scope"]; duplicateOf?: string } = {},
): Verdict {
  return {
    id,
    status,
    scope: options.scope ?? "change",
    siblings: ["docs/decisions/0001.md:4"],
    duplicateOf: options.duplicateOf ?? "",
    evidence: "The evidence.",
  };
}

function stateAfter(round: number, openFindings: Finding[]): ReviewState {
  return { head: earlierHead, round, openFindings };
}

function input(
  plan: ReviewPlan,
  findings: Finding[] | undefined,
  verdicts: Verdict[] | undefined,
): ReviewInput {
  return {
    plan,
    reviewedHead,
    toVerify:
      findings === undefined ? undefined : { findings, candidateStandards: [] },
    verdicts,
    runs: ["The reviewer ran for 6 minutes in 41 turns."],
    inputProblems: [],
  };
}

const firstReview = planReview(stateBeforeFirstRound, undefined, [docs]);

test("passes a first round without findings and records the reviewed head", () => {
  const outcome = summarizeReview(input(firstReview, [], undefined));
  expect(outcome).toEqual({
    passed: true,
    verdict: "No verified finding in the change remains.",
    body: [
      "## Review panel",
      "",
      "**Passed.** No verified finding in the change remains.",
      "",
      "Round 1 reviewed the whole change through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.",
    ].join("\n"),
    state: { head: reviewedHead, round: 1, openFindings: [] },
    outside: { round: 1, findings: [], candidateStandards: [] },
  });
});

test("names one lens in the singular", () => {
  const plan: ReviewPlan = { ...firstReview, lenses: ["docs"] };
  expect(summarizeReview(input(plan, [], undefined)).body).toContain(
    "Round 1 reviewed the whole change through the docs lens.",
  );
});

test("fails on a confirmed finding in the change, shows it with the verifier's siblings, and keeps it open", () => {
  const outcome = summarizeReview(
    input(firstReview, [finding("1.1")], [verdict("1.1", "confirmed")]),
  );
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe("1 verified finding in the change remains.");
  expect(outcome.body).toBe(
    [
      "## Review panel",
      "",
      "**Failed.** 1 verified finding in the change remains.",
      "",
      "Round 1 reviewed the whole change through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.",
      "",
      "### Verified findings in the change",
      "",
      "1. `docs/product.md:3` (docs, finding 1.1): The claim.",
      "   - Basis: The basis.",
      "   - Evidence: The evidence.",
      "   - Siblings: docs/decisions/0001.md:4",
    ].join("\n"),
  );
  expect(outcome.state).toEqual({
    head: reviewedHead,
    round: 1,
    openFindings: [
      { ...finding("1.1"), siblings: ["docs/decisions/0001.md:4"] },
    ],
  });
});

test("counts several remaining findings in the plural", () => {
  const outcome = summarizeReview(
    input(
      firstReview,
      [finding("1.1"), finding("1.2")],
      [verdict("1.1", "confirmed"), verdict("1.2", "confirmed")],
    ),
  );
  expect(outcome.verdict).toBe("2 verified findings in the change remain.");
});

test("passes with a confirmed finding outside the change and the candidate standards, which the issue records", () => {
  const outcome = summarizeReview({
    ...input(
      firstReview,
      [finding("1.1", "change")],
      [verdict("1.1", "confirmed", { scope: "existing" })],
    ),
    toVerify: {
      findings: [finding("1.1", "change")],
      candidateStandards: [
        { standard: "The standard.", incident: "The incident." },
      ],
    },
  });
  expect(outcome.passed).toBe(true);
  expect(outcome.state?.openFindings).toEqual([]);
  expect(outcome.outside.findings.map(({ id }) => id)).toEqual(["1.1"]);
  expect(outsideIssue("61", outcome.outside)).toEqual({
    title: "Fix what the review of pull request #61 found outside it",
    body: [
      "The review panel found these in round 1 of pull request #61. They lie outside its change, so they did not block it. A pull request of their own fixes each finding and adopts or declines each candidate standard.",
      "",
      "## Verified findings",
      "",
      "1. `docs/product.md:3` (docs, finding 1.1): The claim.",
      "   - Basis: The basis.",
      "   - Evidence: The evidence.",
      "   - Siblings: docs/decisions/0001.md:4",
      "",
      "## Candidate standards",
      "",
      "- The standard. Incident: The incident.",
    ].join("\n"),
  });
});

test("lists the open findings that the verifier found fixed, apart from the refuted and the duplicate findings", () => {
  const previous = stateAfter(1, [finding("1.1"), finding("1.2")]);
  const plan = planReview(previous, earlierHead, [docs]);
  const outcome = summarizeReview(
    input(
      plan,
      [
        finding("2.1"),
        finding("2.2"),
        finding("2.3"),
        finding("1.1"),
        finding("1.2"),
      ],
      [
        verdict("2.1", "refuted"),
        verdict("2.2", "confirmed", { scope: "existing" }),
        verdict("2.3", "duplicate", { duplicateOf: "2.2" }),
        verdict("1.1", "refuted"),
        verdict("1.2", "refuted"),
      ],
    ),
  );
  expect(outcome.passed).toBe(true);
  expect(outcome.body).toBe(
    [
      "## Review panel",
      "",
      "**Passed.** No verified finding in the change remains.",
      "",
      `Round 2 reviewed the commits since ${earlierHead} through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.`,
      "",
      "### Fixed since the last round",
      "",
      "- Finding 1.1, `docs/product.md:3`: The evidence.",
      "- Finding 1.2, `docs/product.md:3`: The evidence.",
      "",
      "The verifier refuted 1 finding. The verifier merged 1 duplicate finding into the findings that they repeat.",
    ].join("\n"),
  );
});

test("counts several refuted and duplicate findings in the plural", () => {
  const outcome = summarizeReview(
    input(
      firstReview,
      ["1.1", "1.2", "1.3", "1.4", "1.5"].map((id) => finding(id)),
      [
        verdict("1.1", "refuted"),
        verdict("1.2", "refuted"),
        verdict("1.3", "confirmed", { scope: "existing" }),
        verdict("1.4", "duplicate", { duplicateOf: "1.3" }),
        verdict("1.5", "duplicate", { duplicateOf: "1.3" }),
      ],
    ),
  );
  expect(outcome.body).toContain(
    "The verifier refuted 2 findings. The verifier merged 2 duplicate findings into the findings that they repeat.",
  );
});

test("says when a round only checks the open findings, and when it leaves files unreviewed", () => {
  const checkOnly = planReview(
    stateAfter(1, [finding("1.1")]),
    earlierHead,
    [],
  );
  const verifierRun = ["The verifier ran for 2 minutes in 9 turns."];
  expect(
    summarizeReview({
      ...input(checkOnly, [finding("1.1")], [verdict("1.1", "refuted")]),
      runs: verifierRun,
    }).body,
  ).toContain(
    "Round 2 only checked the open findings. The verifier ran for 2 minutes in 9 turns.",
  );
  const afterReviews = planReview(
    stateAfter(reviewRoundLimit, [finding("1.1")]),
    earlierHead,
    [docs],
  );
  expect(
    summarizeReview({
      ...input(afterReviews, [finding("1.1")], [verdict("1.1", "refuted")]),
      runs: verifierRun,
    }).body,
  ).toContain(
    `Round 4 only checked the open findings. No agent reviewed the commits since ${earlierHead}, because the panel has used its 3 review rounds.`,
  );
});

test("passes without an agent and says why, for each reason", () => {
  const sentences: [ReviewPlan, string][] = [
    [
      planReview(stateBeforeFirstRound, undefined, []),
      "No agent ran, because the pull request changes no file and no finding is open.",
    ],
    [
      planReview(stateAfter(1, []), earlierHead, []),
      `No agent ran, because the commits since ${earlierHead} changed no file of the pull request and no finding is open.`,
    ],
    [
      planReview(stateAfter(reviewRoundLimit, []), earlierHead, [docs]),
      `No agent ran, because no finding is open. No agent reviewed the commits since ${earlierHead}, because the panel has used its 3 review rounds.`,
    ],
  ];
  for (const [plan, sentence] of sentences) {
    const outcome = summarizeReview({
      ...input(plan, undefined, undefined),
      runs: [],
    });
    expect(outcome.passed).toBe(true);
    expect(outcome.body).toContain(`\n\n${sentence}`);
    expect(outcome.state).toEqual({
      head: reviewedHead,
      round: plan.round,
      openFindings: [],
    });
  }
});

test("fails without an agent after every round, shows the open findings, and leaves the state as it was", () => {
  const plan = planReview(
    stateAfter(reviewRoundLimit + checkRoundLimit, [
      finding("1.1"),
      finding("1.2"),
    ]),
    earlierHead,
    [],
  );
  const outcome = summarizeReview({
    ...input(plan, undefined, undefined),
    runs: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The panel has used its 3 review rounds and its 2 rounds that check open findings, and 2 findings stay open, so it ran no agent. A maintainer decides how this pull request continues.",
  );
  expect(outcome.body).toContain("1. `docs/product.md:3` (docs, finding 1.1)");
  expect(outcome.state).toBeUndefined();
});

test("counts a round whose agent did not finish, but keeps the head and the open findings of the last finished round", () => {
  const previous = stateAfter(1, [finding("1.1")]);
  const plan = planReview(previous, earlierHead, [order]);
  const unfinished: [ReviewInput, string][] = [
    [
      input(plan, undefined, undefined),
      "The reviewer's report is missing, so this change has not been reviewed. The log of the run names the reason.",
    ],
    [
      input(planReview(previous, earlierHead, []), undefined, undefined),
      "The open findings were not saved for the verifier, so none has been checked. The log of the run names the reason.",
    ],
    [
      input(plan, [finding("2.1"), finding("1.1")], undefined),
      "The verifier's verdicts are missing, so no finding has been verified. The log of the run names the reason.",
    ],
    [
      {
        ...input(plan, [], undefined),
        inputProblems: ["The first problem.", "The second problem."],
      },
      "The first problem. The second problem.",
    ],
  ];
  for (const [unfinishedInput, verdictSentence] of unfinished) {
    const outcome = summarizeReview(unfinishedInput);
    expect(outcome.passed).toBe(false);
    expect(outcome.verdict).toBe(verdictSentence);
    expect(outcome.state).toEqual({ ...previous, round: 2 });
    expect(outcome.outside).toEqual({
      round: 2,
      findings: [],
      candidateStandards: [],
    });
  }
});

test("fails when the verifier did not answer each finding exactly once", () => {
  const outcome = summarizeReview(
    input(
      firstReview,
      [finding("1.1"), finding("1.2")],
      [
        verdict("1.1", "refuted"),
        verdict("1.1", "refuted"),
        verdict("1.9", "refuted"),
      ],
    ),
  );
  expect(outcome.verdict).toBe(
    "The verifier must give exactly one verdict for each finding, so its answer cannot be trusted. Missing: 1.2. Unknown: 1.9. Repeated: 1.1.",
  );
  expect(outcome.state).toEqual({ ...stateBeforeFirstRound, round: 1 });
});

test("fails when one duplicate or several repeat no confirmed finding", () => {
  const one = summarizeReview(
    input(
      firstReview,
      [finding("1.1"), finding("1.2")],
      [
        verdict("1.1", "refuted"),
        verdict("1.2", "duplicate", { duplicateOf: "1.1" }),
      ],
    ),
  );
  expect(one.verdict).toBe(
    "A duplicate must repeat a confirmed finding, but 1.2 repeats none.",
  );
  const several = summarizeReview(
    input(
      firstReview,
      [finding("1.1"), finding("1.2")],
      [
        verdict("1.1", "duplicate", { duplicateOf: "1.9" }),
        verdict("1.2", "duplicate", { duplicateOf: "1.9" }),
      ],
    ),
  );
  expect(several.verdict).toBe(
    "A duplicate must repeat a confirmed finding, but 1.1 and 1.2 repeat none.",
  );
});
