import { expect, test } from "vitest";
import type { Finding, Verdict } from "./review-findings.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";
import {
  checkRoundLimit,
  mergeReviewRoundLimit,
  planReview,
  reviewRoundLimit,
} from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import { parseLatestReviewState } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import type { ReviewInput } from "./judge-review.ts";
import {
  oversizeProblem,
  outsideIssue,
  summarizeReview,
  supersededRun,
  unplannedReview,
} from "./summarize-review.ts";

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
  return { head: earlierHead, round, mergeRounds: 0, openFindings };
}

/** The coverage of a reviewer that read every file under review and checked through every lens. */
function coverageOf(plan: ReviewPlan): {
  readFiles: string[];
  lensChecks: { lens: Lens; checked: string }[];
} {
  return {
    readFiles: plan.files,
    lensChecks: plan.lenses.map((lens) => ({
      lens,
      checked: "What the lens checked.",
    })),
  };
}

function input(
  plan: ReviewPlan,
  findings: Finding[] | undefined,
  verdicts: Verdict[] | undefined,
): ReviewInput {
  return {
    plan,
    reviewedHead,
    report:
      findings === undefined
        ? undefined
        : { findings, candidateStandards: [], ...coverageOf(plan) },
    verdicts,
    jobResults: finishedJobs(plan),
    runs: ["The reviewer ran for 6 minutes in 41 turns."],
    inputProblems: [],
  };
}

/** The results that GitHub gives the jobs of a round that finished, where a job that the plan does not need is skipped. */
function finishedJobs(plan: ReviewPlan): Record<string, string> {
  const agentResults: Record<ReviewPlan["kind"], [string, string]> = {
    review: ["success", "success"],
    check: ["skipped", "success"],
    pass: ["skipped", "skipped"],
    unchanged: ["skipped", "skipped"],
    capped: ["skipped", "skipped"],
  };
  const [reviewer, verifier] = agentResults[plan.kind];
  return { plan: "success", reviewer, verifier };
}

const firstReview = planReview(
  stateBeforeFirstRound,
  { since: undefined, commitScope: "author" },
  [docs],
);

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
      "Round 1 reviewed the whole change, in 1 file, through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.",
      "",
      "### What each lens checked",
      "",
      "- consistency: What the lens checked.",
      "- docs: What the lens checked.",
      "- standards: What the lens checked.",
    ].join("\n"),
    state: { head: reviewedHead, round: 1, mergeRounds: 0, openFindings: [] },
    outside: { round: 1, findings: [], candidateStandards: [] },
  });
});

test("names one lens in the singular", () => {
  const plan: ReviewPlan = { ...firstReview, lenses: ["docs"] };
  expect(summarizeReview(input(plan, [], undefined)).body).toContain(
    "Round 1 reviewed the whole change, in 1 file, through the docs lens.",
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
      "Round 1 reviewed the whole change, in 1 file, through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.",
      "",
      "### What each lens checked",
      "",
      "- consistency: What the lens checked.",
      "- docs: What the lens checked.",
      "- standards: What the lens checked.",
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
    mergeRounds: 0,
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
    report: {
      findings: [finding("1.1", "change")],
      candidateStandards: [
        { standard: "The standard.", incident: "The incident." },
      ],
      ...coverageOf(firstReview),
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
  const plan = planReview(
    previous,
    { since: earlierHead, commitScope: "author" },
    [docs],
  );
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
      `Round 2 reviewed the commits since ${earlierHead}, in 1 file, through the consistency, docs, and standards lenses. The reviewer ran for 6 minutes in 41 turns.`,
      "",
      "### What each lens checked",
      "",
      "- consistency: What the lens checked.",
      "- docs: What the lens checked.",
      "- standards: What the lens checked.",
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

test("says that a round after the review rounds only checked the open findings, and that no reviewer read the new commits", () => {
  const plan = planReview(
    stateAfter(reviewRoundLimit, [finding("1.1")]),
    { since: earlierHead, commitScope: "author" },
    [docs],
  );
  expect(
    summarizeReview({
      ...input(plan, [finding("1.1")], [verdict("1.1", "refuted")]),
      runs: ["The verifier ran for 2 minutes in 9 turns."],
    }).body,
  ).toContain(
    `Round 4 only checked the open findings. No reviewer read the commits since ${earlierHead}, because the panel has used its 3 ordinary review rounds. The verifier ran for 2 minutes in 9 turns.`,
  );
});

test("records an extra merge review and checks its findings alongside earlier findings", () => {
  const previous = stateAfter(reviewRoundLimit, [finding("1.1")]);
  const plan = planReview(
    previous,
    { since: earlierHead, commitScope: "base-merges" },
    [docs],
  );
  expect(plan.kind).toBe("review");
  expect(plan.mergeRounds).toBe(1);
  const outcome = summarizeReview(
    input(
      plan,
      [finding("4.1"), finding("1.1")],
      [verdict("4.1", "confirmed"), verdict("1.1", "refuted")],
    ),
  );
  expect(outcome.passed).toBe(false);
  expect(outcome.state).toMatchObject({
    head: reviewedHead,
    round: reviewRoundLimit + 1,
    mergeRounds: 1,
  });
  expect(outcome.state?.openFindings.map(({ id }) => id)).toEqual(["4.1"]);
  expect(outcome.body).toContain("It used an extra merge review round.");
});

test("counts failed merge reviews to their own cap without advancing the reviewed head", () => {
  let previous = stateAfter(reviewRoundLimit, []);
  for (let used = 0; used < mergeReviewRoundLimit; used += 1) {
    const plan = planReview(
      previous,
      { since: earlierHead, commitScope: "base-merges" },
      [docs],
    );
    expect(plan.kind).toBe("review");
    const outcome = summarizeReview(input(plan, undefined, undefined));
    expect(outcome.state).toEqual({
      ...previous,
      round: previous.round + 1,
      mergeRounds: used + 1,
    });
    if (outcome.state === undefined) {
      throw new Error("The failed merge round must save its counters.");
    }
    previous = outcome.state;
  }
  expect(previous.mergeRounds).toBe(mergeReviewRoundLimit);
  expectFailureWithoutAgent(
    planReview(previous, { since: earlierHead, commitScope: "base-merges" }, [
      docs,
    ]),
    `The panel has used its 2 extra merge review rounds, so it ran no agent to read further changes. ${nextStep}`,
  );
});

test("passes without an agent when no file changed and no finding is open, with and without a reviewed head", () => {
  const sentences: [ReviewPlan, string][] = [
    [
      planReview(
        stateBeforeFirstRound,
        { since: undefined, commitScope: "author" },
        [],
      ),
      "No agent ran, because the pull request changes no file and no finding is open.",
    ],
    [
      planReview(
        stateAfter(1, []),
        { since: earlierHead, commitScope: "author" },
        [],
      ),
      `No agent ran, because the commits since ${earlierHead} changed no file of the pull request and no finding is open.`,
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
      mergeRounds: 0,
      openFindings: [],
    });
  }
});

/** Checks that a plan fails without an agent with this verdict, shows each open finding, and leaves the state as it was. */
function expectFailureWithoutAgent(plan: ReviewPlan, verdict: string): void {
  const outcome = summarizeReview({
    ...input(plan, undefined, undefined),
    runs: [],
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(verdict);
  expect(outcome.body).toContain(`**Failed.** ${verdict}`);
  for (const finding of plan.previous.openFindings) {
    expect(outcome.body).toContain(
      `\`${finding.location}\` (${finding.lens}, finding ${finding.id})`,
    );
  }
  expect(outcome.state).toBeUndefined();
}

test("fails without an agent and leaves the state as it was when no file changed while one finding or several stay open", () => {
  const cases: [Finding[], string][] = [
    [
      [finding("1.1")],
      "1 verified finding in the change remains, and no file of the pull request changed since the last finished round, so no agent ran. Push the fixes to start the next round.",
    ],
    [
      [finding("1.1"), finding("1.2")],
      "2 verified findings in the change remain, and no file of the pull request changed since the last finished round, so no agent ran. Push the fixes to start the next round.",
    ],
  ];
  for (const [openFindings, sentence] of cases) {
    expectFailureWithoutAgent(
      planReview(
        stateAfter(1, openFindings),
        { since: earlierHead, commitScope: "author" },
        [],
      ),
      sentence,
    );
  }
});

const nextStep =
  "The author decides how the change continues, for example in a new pull request with the same commits, which starts with new rounds.";

test("fails without an agent after every round while one finding or several stay open, and leaves the state as it was", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  const cases: [Finding[], string][] = [
    [
      [finding("1.1")],
      `The panel has used its 3 ordinary review rounds, and this push cannot use a remaining merge review or one of its 2 rounds that check open findings. 1 finding stays open, so it ran no agent. ${nextStep}`,
    ],
    [
      [finding("1.1"), finding("1.2")],
      `The panel has used its 3 ordinary review rounds, and this push cannot use a remaining merge review or one of its 2 rounds that check open findings. 2 findings stay open, so it ran no agent. ${nextStep}`,
    ],
  ];
  for (const [openFindings, sentence] of cases) {
    expectFailureWithoutAgent(
      planReview(
        stateAfter(lastCheck, openFindings),
        { since: earlierHead, commitScope: "author" },
        [docs],
      ),
      sentence,
    );
  }
});

test("fails without an agent when files change after the review rounds while no finding is open, and when no round finished reviewing the change", () => {
  const cases: [ReviewPlan, string][] = [
    [
      planReview(
        stateAfter(reviewRoundLimit, []),
        { since: earlierHead, commitScope: "author" },
        [docs],
      ),
      `The panel has used its 3 ordinary review rounds, and the commits since ${earlierHead} changed files of the pull request while no finding was open, so no round may read them and no agent ran. ${nextStep}`,
    ],
    [
      planReview(
        {
          head: undefined,
          round: reviewRoundLimit,
          mergeRounds: 0,
          openFindings: [],
        },
        { since: undefined, commitScope: "author" },
        [docs],
      ),
      `The panel has used its 3 ordinary review rounds, and no round finished reviewing the change, so no round may read them and no agent ran. ${nextStep}`,
    ],
  ];
  for (const [plan, sentence] of cases) {
    expectFailureWithoutAgent(plan, sentence);
  }
});

test("counts a round whose agent did not finish, but keeps the head and the open findings of the last finished round", () => {
  const afterOneRound = stateAfter(1, [finding("1.1")]);
  const afterReviews = stateAfter(reviewRoundLimit, [finding("1.1")]);
  const review = planReview(
    afterOneRound,
    { since: earlierHead, commitScope: "author" },
    [order],
  );
  const check = planReview(
    afterReviews,
    { since: earlierHead, commitScope: "author" },
    [order],
  );
  const unfinished: [ReviewInput, ReviewState, string][] = [
    [
      input(review, undefined, undefined),
      afterOneRound,
      "The reviewer's report is missing, so this change has not been reviewed. The log of the reviewer's job names the reason.",
    ],
    [
      input(check, [finding("1.1")], undefined),
      afterReviews,
      "The verifier's verdicts are missing, so no finding has been verified. The log of the verifier's job names the reason.",
    ],
    [
      input(review, [finding("2.1"), finding("1.1")], undefined),
      afterOneRound,
      "The verifier's verdicts are missing, so no finding has been verified. The log of the verifier's job names the reason.",
    ],
    [
      {
        ...input(review, [], undefined),
        inputProblems: ["The first problem.", "The second problem."],
      },
      afterOneRound,
      "The first problem. The second problem.",
    ],
  ];
  for (const [unfinishedInput, previous, verdictSentence] of unfinished) {
    const outcome = summarizeReview(unfinishedInput);
    expect(outcome.passed).toBe(false);
    expect(outcome.verdict).toBe(verdictSentence);
    expect(outcome.state).toEqual({ ...previous, round: previous.round + 1 });
    expect(outcome.outside).toEqual({
      round: previous.round + 1,
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

test("fails a review whose report does not name a file under review as read, or one lens as checked", () => {
  const plan = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs],
  );
  const outcome = summarizeReview({
    ...input(plan, [], undefined),
    report: {
      findings: [],
      candidateStandards: [],
      readFiles: [],
      lensChecks: [
        { lens: "docs", checked: "What the lens checked." },
        { lens: "standards", checked: "What the lens checked." },
      ],
    },
  });
  expect(outcome.passed).toBe(false);
  expect(outcome.verdict).toBe(
    "The reviewer's report cannot be trusted, because it does not name the file docs/product.md as read and it does not say what it checked through the consistency lens. So this change has not been fully reviewed.",
  );
  expect(outcome.body).not.toContain("### What each lens checked");
  expect(outcome.state).toEqual({ ...stateBeforeFirstRound, round: 1 });
});

test("names several unread files and several unchecked lenses in the plural", () => {
  const plan = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs, order],
  );
  const outcome = summarizeReview({
    ...input(plan, [], undefined),
    report: {
      findings: [],
      candidateStandards: [],
      readFiles: [],
      lensChecks: [],
    },
  });
  expect(outcome.verdict).toBe(
    "The reviewer's report cannot be trusted, because it does not name the files docs/product.md and app/features/trading/order.ts as read and it does not say what it checked through the consistency, craft, docs, reliability, and standards lenses. So this change has not been fully reviewed.",
  );
});

test("calls a cancelled run superseded only when the head moved, because a timeout also cancels a job", () => {
  const cancelled = { plan: "success", reviewer: "cancelled" };
  expect(supersededRun(cancelled, earlierHead, reviewedHead)).toBe(
    `A newer push moved the pull request to ${reviewedHead} while this run reviewed ${earlierHead}, so the run for the newer head posts the review.`,
  );
  expect(supersededRun(cancelled, reviewedHead, reviewedHead)).toBeUndefined();
  expect(
    supersededRun(
      { plan: "success", reviewer: "failure" },
      earlierHead,
      reviewedHead,
    ),
  ).toBeUndefined();
});

test("explains a round without a plan, whether the plan is missing or cannot be read", () => {
  expect(unplannedReview("failure", undefined)).toEqual({
    verdict:
      'The review job found no plan of the round, so this change has not been reviewed. The plan job ended with the result "failure", and its log names the reason.',
    body: [
      "## Review panel",
      "",
      '**Failed.** The review job found no plan of the round, so this change has not been reviewed. The plan job ended with the result "failure", and its log names the reason.',
    ].join("\n"),
  });
  expect(
    unplannedReview("success", "PLAN must be a JSON object, but it is 7.")
      .verdict,
  ).toBe(
    "The plan of the round cannot be read, so this change has not been reviewed. PLAN must be a JSON object, but it is 7.",
  );
});

test("refuses a review or an issue just past the length that GitHub takes, and accepts one at that length", () => {
  const atLimit = "a".repeat(65_536);
  expect(oversizeProblem("review", atLimit)).toBeUndefined();
  expect(oversizeProblem("review", `${atLimit}a`)).toBe(
    "The review is 65,537 characters long, but GitHub takes at most 65,536, so it was not posted, and the log of this step holds it.",
  );
  expect(oversizeProblem("issue", `${atLimit}a`)).toBe(
    "The issue is 65,537 characters long, but GitHub takes at most 65,536, so it was not opened.",
  );
});

test("fails a round when a job that the plan needs did not succeed, even after an answer, and points only at the logs of the jobs that ran", () => {
  const review = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs],
  );
  const cases: [Record<string, string>, string][] = [
    [
      { plan: "success", reviewer: "success", verifier: "failure" },
      'In this round, the verifier job ended with the result "failure", so the round has not finished. The log of the verifier job names the reason.',
    ],
    [
      { plan: "success", reviewer: "failure", verifier: "skipped" },
      'In this round, the reviewer job ended with the result "failure" and the verifier job was skipped, so the round has not finished. The log of the reviewer job names the reason.',
    ],
    [
      { plan: "success", reviewer: "failure", verifier: "cancelled" },
      'In this round, the reviewer job ended with the result "failure" and the verifier job ended with the result "cancelled", so the round has not finished. The logs of the reviewer and verifier jobs name the reason.',
    ],
    [
      { plan: "success", reviewer: "skipped" },
      "In this round, the reviewer job was skipped and the verifier job has no result, so the round has not finished.",
    ],
  ];
  for (const [jobResults, sentence] of cases) {
    const outcome = summarizeReview({
      ...input(review, [], undefined),
      jobResults,
    });
    expect(outcome.passed).toBe(false);
    expect(outcome.verdict).toBe(sentence);
    expect(outcome.state).toEqual({ ...stateBeforeFirstRound, round: 1 });
  }
});
