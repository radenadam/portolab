import {
  checkRoundLimit,
  mergeReviewRoundLimit,
  reviewRoundLimit,
} from "./review-limits.ts";
import {
  parseReviewPlan,
  buildRoundReport,
  describeReviewScope,
  planReview,
} from "./review-plan.ts";

import { expect, test } from "vitest";
import { parseReviewerReport } from "./review-findings.ts";
import type { Finding } from "./review-findings.ts";
import type { CommitScope } from "./review-history.ts";
import type { ChangedFile } from "./review-lenses.ts";

import type { ReviewPlan } from "./review-plan.ts";
import { summarizeReview } from "./summarize-review.ts";
import { parseLatestReviewState, parseReviewState } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";

// planReview takes the state that parseLatestReviewState reads, which holds no round before any review carries a state.
const stateBeforeFirstRound = successValueForTest(
  parseLatestReviewState([], "reviews"),
  "The reviews of a new pull request hold no state",
);

const head = "1".repeat(40);
const docs: ChangedFile = { path: "docs/product.md", change: "modified" };
const openFinding: Finding = {
  id: "1.1",
  lens: "docs",
  location: "docs/product.md:3",
  claim: "The claim.",
  basis: "The basis.",
  siblings: [],
  rootCause: "",
  scope: "change",
};

function stateAfter(
  round: number,
  openFindings: Finding[],
  mergeRounds = 0,
): ReviewState {
  return {
    head,
    round,
    mergeRounds,
    checkRounds: Math.max(0, round - mergeRounds - reviewRoundLimit),
    openFindings,
  };
}

function withoutModernFields(value: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([field]) => !["mergeRounds", "checkRounds", "fixFiles"].includes(field),
    ),
  );
}

test("reviews the whole change in the first round", () => {
  expect(
    planReview(
      stateBeforeFirstRound,
      { since: undefined, commitScope: "author" },
      [docs],
    ),
  ).toEqual({
    fixFiles: [],
    checkRounds: 0,
    kind: "review",
    round: 1,
    mergeRounds: 0,
    since: undefined,
    lenses: ["consistency", "docs", "standards"],
    files: ["docs/product.md"],
    previous: stateBeforeFirstRound,
  });
});

test("reviews the files since the last reviewed head in a later round, up to the last review round", () => {
  const previous = stateAfter(reviewRoundLimit - 1, [openFinding]);
  expect(
    planReview(previous, { since: head, commitScope: "author" }, [docs]),
  ).toMatchObject({
    kind: "review",
    round: reviewRoundLimit,
    mergeRounds: 0,
    since: head,
  });
});

test("passes without an agent when no file changed and no finding is open", () => {
  const previous = stateAfter(1, []);
  expect(
    planReview(previous, { since: head, commitScope: "author" }, []),
  ).toEqual({
    fixFiles: [],
    checkRounds: 0,
    kind: "pass",
    round: 1,
    mergeRounds: 0,
    since: head,
    lenses: [],
    files: [],
    previous,
  });
});

test("keeps the open findings without an agent when no file changed, because nothing could have fixed them", () => {
  const previous = stateAfter(1, [openFinding]);
  expect(
    planReview(previous, { since: head, commitScope: "author" }, []),
  ).toMatchObject({
    kind: "unchanged",
    round: 1,
    mergeRounds: 0,
  });
});

test("checks only the open findings after the review rounds, up to the last check round", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  expect(
    planReview(
      stateAfter(reviewRoundLimit, [openFinding]),
      { since: head, commitScope: "author" },
      [docs],
    ),
  ).toMatchObject({ kind: "check", round: reviewRoundLimit + 1, lenses: [] });
  expect(
    planReview(
      stateAfter(lastCheck - 1, [openFinding]),
      { since: head, commitScope: "author" },
      [docs],
    ),
  ).toMatchObject({ kind: "check", round: lastCheck });
});

test("caps the rounds without an agent when findings stay open after the last check round", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  expect(
    planReview(
      stateAfter(lastCheck, [openFinding]),
      { since: head, commitScope: "author" },
      [docs],
    ),
  ).toMatchObject({ kind: "capped", round: lastCheck });
});

test("caps the rounds without an agent when files change after the review rounds while no finding is open", () => {
  expect(
    planReview(
      stateAfter(reviewRoundLimit, []),
      { since: head, commitScope: "author" },
      [docs],
    ),
  ).toMatchObject({ kind: "capped", round: reviewRoundLimit });
});

test("caps the rounds when every review round failed, so a change that no round finished reviewing never passes", () => {
  const failedRounds: ReviewState = {
    head: undefined,
    round: reviewRoundLimit,
    mergeRounds: 0,
    checkRounds: 0,
    openFindings: [],
  };
  expect(
    planReview(failedRounds, { since: undefined, commitScope: "author" }, [
      docs,
    ]),
  ).toMatchObject({
    kind: "capped",
    round: reviewRoundLimit,
    mergeRounds: 0,
  });
});

test("reviews only merge resolutions after the ordinary cap, through the last extra merge round, with or without open findings", () => {
  for (const openFindings of [[], [openFinding]]) {
    for (const mergeRounds of [0, mergeReviewRoundLimit - 1]) {
      const previous = stateAfter(
        reviewRoundLimit + mergeRounds,
        openFindings,
        mergeRounds,
      );
      expect(previous.round - previous.mergeRounds).toBe(reviewRoundLimit);
      expect(
        planReview(previous, { since: head, commitScope: "base-merges" }, [
          docs,
        ]),
      ).toEqual({
        fixFiles: [],
        checkRounds: 0,
        kind: "review",
        round: previous.round + 1,
        mergeRounds: mergeRounds + 1,
        since: head,
        files: [docs.path],
        lenses: ["consistency", "docs", "standards"],
        previous,
      });
    }
  }
});

test("uses an ordinary review round for a merge before the cap", () => {
  const previous = stateAfter(reviewRoundLimit - 1, []);
  expect(
    planReview(previous, { since: head, commitScope: "base-merges" }, [docs]),
  ).toMatchObject({
    kind: "review",
    round: reviewRoundLimit,
    mergeRounds: 0,
  });
});

test("passes a merge that resolves nothing without spending an extra round, even after every cap", () => {
  const round = reviewRoundLimit + checkRoundLimit + mergeReviewRoundLimit;
  const previous = stateAfter(round, [], mergeReviewRoundLimit);
  expect(previous.mergeRounds).toBe(mergeReviewRoundLimit);
  expect(
    planReview(previous, { since: head, commitScope: "base-merges" }, []),
  ).toMatchObject({
    kind: "pass",
    round,
    mergeRounds: mergeReviewRoundLimit,
  });
  expect(
    planReview(
      { ...previous, openFindings: [openFinding] },
      { since: head, commitScope: "base-merges" },
      [],
    ),
  ).toMatchObject({
    kind: "unchanged",
    round,
    mergeRounds: mergeReviewRoundLimit,
  });
});

test("caps further merge resolutions after their own limit, even with an open finding and unused check rounds", () => {
  for (const openFindings of [[], [openFinding]]) {
    const round = reviewRoundLimit + mergeReviewRoundLimit;
    const previous = stateAfter(round, openFindings, mergeReviewRoundLimit);
    expect(previous.mergeRounds).toBe(mergeReviewRoundLimit);
    expect(
      planReview(previous, { since: head, commitScope: "base-merges" }, [docs]),
    ).toMatchObject({
      kind: "capped",
      round,
      mergeRounds: mergeReviewRoundLimit,
    });
  }
});

test("caps a merge that also carries other changes with or without open findings", () => {
  for (const openFindings of [[], [openFinding]]) {
    const previous = stateAfter(reviewRoundLimit, openFindings);
    expect(
      planReview(previous, { since: head, commitScope: "mixed" }, [docs]),
    ).toMatchObject({
      kind: "capped",
      round: reviewRoundLimit,
      mergeRounds: 0,
    });
  }
});

test("caps changes without a contained reviewed head instead of granting a merge round", () => {
  const previous = stateAfter(reviewRoundLimit, []);
  expect(
    planReview(previous, { since: undefined, commitScope: "author" }, [docs]),
  ).toMatchObject({
    kind: "capped",
    round: reviewRoundLimit,
    mergeRounds: 0,
  });
});

test("keeps the limits of checks and merge reviews independent", () => {
  const afterMerges = stateAfter(
    reviewRoundLimit + mergeReviewRoundLimit,
    [openFinding],
    mergeReviewRoundLimit,
  );
  for (let checks = 0; checks < checkRoundLimit; checks += 1) {
    const previous = {
      ...afterMerges,
      round: afterMerges.round + checks,
      checkRounds: checks,
    };
    expect(previous.round - previous.mergeRounds).toBe(
      reviewRoundLimit + checks,
    );
    expect(
      planReview(previous, { since: head, commitScope: "author" }, [docs]),
    ).toMatchObject({
      kind: "check",
      round: previous.round + 1,
      mergeRounds: mergeReviewRoundLimit,
    });
  }
  const exhausted = {
    ...afterMerges,
    round: afterMerges.round + checkRoundLimit,
    checkRounds: checkRoundLimit,
  };
  expect(
    planReview(exhausted, { since: head, commitScope: "author" }, [docs]),
  ).toMatchObject({ kind: "capped" });
  const afterChecks = stateAfter(reviewRoundLimit + checkRoundLimit, []);
  expect(
    planReview(afterChecks, { since: head, commitScope: "base-merges" }, [
      docs,
    ]),
  ).toMatchObject({
    kind: "review",
    round: afterChecks.round + 1,
    mergeRounds: 1,
  });
});

test("reviews a combined push before the ordinary cap without spending reserved allowances", () => {
  const previous = stateAfter(reviewRoundLimit - 1, [openFinding]);
  expect(
    planReview(
      previous,
      {
        since: head,
        commitScope: "fixes-and-merges",
        authorFiles: [docs],
        mergeFiles: [docs],
      },
      [docs],
    ),
  ).toMatchObject({
    kind: "review",
    round: reviewRoundLimit,
    mergeRounds: 0,
    files: [docs.path],
    fixFiles: [],
  });
});

test("charges a finding fix with a base merge to both allowances through their last rounds", () => {
  const mergeFile: ChangedFile = { path: "app/theme.css", change: "modified" };
  for (const checks of [0, checkRoundLimit - 1]) {
    for (const merges of [0, mergeReviewRoundLimit - 1]) {
      const previous = stateAfter(
        reviewRoundLimit + checks + merges,
        [openFinding],
        merges,
      );
      expect(previous.round - previous.mergeRounds).toBe(
        reviewRoundLimit + checks,
      );
      const plan = planReview(
        previous,
        {
          since: head,
          commitScope: "fixes-and-merges",
          authorFiles: [docs],
          mergeFiles: [mergeFile],
        },
        [docs, mergeFile],
      );
      expect(plan).toMatchObject({
        kind: "review",
        round: previous.round + 2,
        mergeRounds: merges + 1,
        checkRounds: checks + 1,
        files: [mergeFile.path],
        fixFiles: [docs.path],
        lenses: ["consistency", "craft", "docs", "product", "standards"],
      });
      expect(parseReviewPlan(JSON.parse(JSON.stringify(plan)), "PLAN")).toEqual(
        { ok: true, value: plan },
      );
    }
  }
});

test("spends no merge allowance for a fix with a clean merge and no check allowance for a merge without author changes", () => {
  for (const authorFiles of [[], [docs]]) {
    const mergeFiles = authorFiles.length === 0 ? [docs] : [];
    const previous = stateAfter(reviewRoundLimit, [openFinding]);
    const plan = planReview(
      previous,
      { since: head, commitScope: "fixes-and-merges", authorFiles, mergeFiles },
      [docs],
    );
    expect(plan).toMatchObject({
      kind: mergeFiles.length === 0 ? "check" : "review",
      round: previous.round + 1,
      mergeRounds: mergeFiles.length,
      files: mergeFiles.map(({ path }) => path),
      fixFiles: authorFiles.map(({ path }) => path),
    });
  }
});

test("refuses a combined push when either allowance is exhausted or no finding is open", () => {
  for (const [checks, merges, openFindings] of [
    [checkRoundLimit, 0, [openFinding]],
    [0, mergeReviewRoundLimit, [openFinding]],
    [0, 0, []],
  ] as const) {
    const previous = stateAfter(
      reviewRoundLimit + checks + merges,
      [...openFindings],
      merges,
    );
    expect(
      planReview(
        previous,
        {
          since: head,
          commitScope: "fixes-and-merges",
          authorFiles: [docs],
          mergeFiles: [docs],
        },
        [docs],
      ),
    ).toMatchObject({
      kind: "capped",
      round: previous.round,
      mergeRounds: merges,
    });
  }
});

test("fails combined fixes and merges with unrelated author work, missing checks, or unfinished jobs without refilling budgets", () => {
  const other: ChangedFile = { path: "unrelated.ts", change: "added" };
  const previous = stateAfter(reviewRoundLimit, [openFinding]);
  const plan = planReview(
    previous,
    {
      since: head,
      commitScope: "fixes-and-merges",
      authorFiles: [docs, other],
      mergeFiles: [docs],
    },
    [docs, other],
  );
  expect(plan.kind).toBe("review");
  expect(plan.fixFiles).toEqual([docs.path, other.path]);
  const report = buildRoundReport(plan, {
    findings: [],
    candidateStandards: [],
    readFiles: plan.files,
    lensChecks: plan.lenses.map((lens) => ({
      lens,
      checked: "Read the merge resolutions.",
    })),
  });
  for (const status of ["fix", "unrelated", undefined] as const) {
    const outcome = summarizeReview({
      plan,
      reviewedHead: "2".repeat(40),
      report,
      verdicts: [
        {
          id: openFinding.id,
          status: "refuted",
          scope: "change",
          siblings: [],
          duplicateOf: "",
          evidence: "The finding is fixed.",
        },
      ],
      fixChecks:
        status === undefined
          ? undefined
          : plan.fixFiles.map((file) => ({
              file,
              status: file === docs.path ? "fix" : status,
              evidence: "Checked each author commit.",
            })),
      jobResults: { plan: "success", reviewer: "success", verifier: "success" },
      runs: [],
      inputProblems: [],
    });
    expect(outcome.passed).toBe(status === "fix");
    expect(outcome.body).toContain(
      "It used an extra merge review round. It also spent a finding-check round on the author files.",
    );
    expect(outcome.state).toMatchObject({
      round: previous.round + 2,
      mergeRounds: 1,
    });
  }
  for (const job of ["reviewer", "verifier"]) {
    const outcome = summarizeReview({
      plan,
      reviewedHead: head,
      report,
      verdicts: undefined,
      jobResults: {
        plan: "success",
        reviewer: "success",
        verifier: "success",
        [job]: "failure",
      },
      runs: [],
      inputProblems: [],
    });
    expect(outcome.passed).toBe(false);
    expect(outcome.state).toEqual({
      ...previous,
      round: previous.round + 2,
      mergeRounds: 1,
      checkRounds: 1,
    });
  }
});

test("reads back the plan that the plan step writes, with and without a reviewed head", () => {
  const plans: ReviewPlan[] = [
    planReview(
      stateBeforeFirstRound,
      { since: undefined, commitScope: "author" },
      [docs],
    ),
    planReview(
      stateAfter(1, [openFinding]),
      { since: head, commitScope: "author" },
      [],
    ),
    planReview(
      stateAfter(reviewRoundLimit, []),
      { since: head, commitScope: "base-merges" },
      [docs],
    ),
  ];
  for (const plan of plans) {
    expect(parseReviewPlan(JSON.parse(JSON.stringify(plan)), "PLAN")).toEqual({
      ok: true,
      value: plan,
    });
  }
});

test("records and parses the refusal reason independently of the other exhausted caps", () => {
  const cases: [
    Exclude<CommitScope, "fixes-and-merges">,
    Finding[],
    ReviewPlan["capReason"],
  ][] = [
    ["base-merges", [], "merge-reviews"],
    ["base-merges", [openFinding], "merge-reviews"],
    ["author", [], "unreviewed-change"],
    ["author", [openFinding], "finding-checks"],
    ["mixed", [], "mixed-push"],
    ["mixed", [openFinding], "mixed-push"],
  ];
  for (const [commitScope, openFindings, capReason] of cases) {
    const previous = stateAfter(
      reviewRoundLimit + checkRoundLimit + mergeReviewRoundLimit,
      openFindings,
      mergeReviewRoundLimit,
    );
    const plan = planReview(previous, { since: head, commitScope }, [docs]);
    expect(plan).toMatchObject({ kind: "capped", capReason });
    expect(parseReviewPlan(JSON.parse(JSON.stringify(plan)), "PLAN")).toEqual({
      ok: true,
      value: plan,
    });
    expect(parseReviewPlan({ ...plan, capReason: "other" }, "PLAN").ok).toBe(
      false,
    );
  }
});

test("rejects a plan with a missing or invalid merge round count", () => {
  const plan = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs],
  );
  for (const mergeRounds of [undefined, -1, 0.5, "1"]) {
    expect(parseReviewPlan({ ...plan, mergeRounds }, "PLAN").ok).toBe(false);
  }
  for (const previous of [undefined, null, {}]) {
    expect(
      parseReviewPlan({ ...plan, mergeRounds: undefined, previous }, "PLAN").ok,
    ).toBe(false);
  }
  expect(
    parseReviewPlan({ ...plan, mergeRounds: plan.round + 1 }, "PLAN"),
  ).toEqual({
    ok: false,
    failure:
      "PLAN must have mergeRounds at most round (1), but mergeRounds is 2.",
  });
});

test("reads a plan from an older pull request head when the final job runs newer code from main", () => {
  const plan = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs],
  );
  const legacy = {
    ...withoutModernFields(plan),
    previous: withoutModernFields(plan.previous),
  };
  expect(parseReviewPlan(legacy, "PLAN")).toEqual({ ok: true, value: plan });
});

test("rejects a plan that names a lens outside the panel or files that are not a list of paths", () => {
  const plan = planReview(
    stateBeforeFirstRound,
    { since: undefined, commitScope: "author" },
    [docs],
  );
  expect(parseReviewPlan({ ...plan, lenses: ["style"] }, "PLAN")).toEqual({
    ok: false,
    failure:
      'PLAN: lens 1 must be "architecture", "consistency", "craft", "docs", "product", "reliability", or "standards", but it is "style".',
  });
  expect(
    parseReviewPlan({ ...plan, files: "docs/product.md" }, "PLAN"),
  ).toEqual({
    ok: false,
    failure:
      'PLAN must have a list of strings at files, but files is "docs/product.md".',
  });
});

test("requires valid author-file lists in current plans", () => {
  const plan = planReview(
    stateAfter(reviewRoundLimit, [openFinding]),
    { since: head, commitScope: "author" },
    [docs],
  );
  for (const fixFiles of [undefined, null, "file.ts", [1]]) {
    expect(parseReviewPlan({ ...plan, fixFiles }, "PLAN").ok).toBe(false);
  }
});

test("tells the reviewer whether the files hold the whole change or what changed since a head, and how to read the diff of one", () => {
  expect(describeReviewScope(undefined, "origin/main")).toBe(
    "They hold the whole change, and `git diff origin/main...HEAD -- <path>` shows what changed in one of them.",
  );
  expect(describeReviewScope(head, "origin/main", true)).toBe(
    `They hold manual base merge resolutions since ${head}. Read only their remerge diffs with \`git log --first-parent --merges --diff-merges=remerge -p ${head}..HEAD -- <path>\`. The verifier checks finding fixes from author commits in this push.`,
  );
  expect(describeReviewScope(head, "origin/main")).toBe(
    `They hold what changed since ${head}, the head that the panel last reviewed, because earlier rounds reviewed the rest of the change. \`git diff ${head} HEAD -- <path>\` shows what changed in one of them since then, and \`git diff origin/main...HEAD -- <path>\` shows its whole change.`,
  );
});

test("builds the report of a review round with its findings numbered after the round before the open ones, and of a round that checks with the open findings alone", () => {
  const previous = stateAfter(1, [openFinding]);
  const review = planReview(previous, { since: head, commitScope: "author" }, [
    docs,
  ]);
  const newFinding = {
    lens: "docs",
    location: "docs/product.md:9",
    claim: "A new claim.",
    basis: "The basis.",
    siblings: [],
    rootCause: "",
    scope: "change",
  };
  const answer = successValueForTest(
    parseReviewerReport(
      {
        findings: [newFinding],
        candidateStandards: [],
        readFiles: ["docs/product.md"],
        lensChecks: [{ lens: "docs", checked: "The brief." }],
      },
      "REVIEWER_OUTPUT",
    ),
    "The reviewer's answer parses",
  );
  expect(buildRoundReport(review, answer)).toEqual({
    ...answer,
    findings: [{ ...newFinding, id: "2.1" }, openFinding],
  });
  const check = planReview(
    stateAfter(reviewRoundLimit, [openFinding]),
    { since: head, commitScope: "author" },
    [docs],
  );
  expect(buildRoundReport(check, undefined)).toEqual({
    findings: [openFinding],
    candidateStandards: [],
    readFiles: [],
    lensChecks: [],
  });
});

test("keeps earlier finding checks spent when a larger ordinary cap permits more reviews", () => {
  for (const mergeRounds of [0, mergeReviewRoundLimit]) {
    let previous = successValueForTest(
      parseReviewState(
        {
          head,
          round: 3 + checkRoundLimit + mergeRounds,
          mergeRounds,
          openFindings: [openFinding],
        },
        "legacy state",
      ),
      "The old state used both finding checks",
    );
    expect(previous.checkRounds).toBe(checkRoundLimit);
    for (let ordinary = 3; ordinary < reviewRoundLimit; ordinary += 1) {
      const plan = planReview(
        previous,
        { since: head, commitScope: "author" },
        [docs],
      );
      expect(plan).toMatchObject({
        kind: "review",
        round: previous.round + 1,
        checkRounds: checkRoundLimit,
        mergeRounds,
      });
      previous = {
        ...previous,
        round: plan.round,
        checkRounds: plan.checkRounds,
        mergeRounds: plan.mergeRounds,
      };
    }
    expect(
      planReview(previous, { since: head, commitScope: "author" }, [docs]),
    ).toMatchObject({ kind: "capped", capReason: "finding-checks" });
  }
});

test("requires current check counters and infers them only for plans from an older head", () => {
  const plan = planReview(
    stateAfter(reviewRoundLimit, [openFinding]),
    { since: head, commitScope: "author" },
    [docs],
  );
  for (const checkRounds of [undefined, -1, 0.5, "1", plan.round + 1]) {
    expect(parseReviewPlan({ ...plan, checkRounds }, "PLAN").ok).toBe(false);
  }
  const legacyPrevious = { ...plan.previous, round: 3, checkRounds: undefined };
  const legacy = {
    ...plan,
    round: 4,
    checkRounds: undefined,
    fixFiles: undefined,
    previous: legacyPrevious,
  };
  expect(parseReviewPlan(legacy, "PLAN")).toEqual({
    ok: true,
    value: {
      ...legacy,
      fixFiles: [],
      checkRounds: 1,
      previous: { ...legacyPrevious, checkRounds: 0 },
    },
  });
});

test("keeps three reviews, a late main merge, and an author correction in one pull request as measured in PR 174", () => {
  const mergedHead = "2".repeat(40);
  const correctedHead = "3".repeat(40);
  const merge = planReview(
    stateAfter(3, []),
    { since: head, commitScope: "base-merges" },
    [docs],
  );
  expect(merge).toMatchObject({
    kind: "review",
    round: 4,
    mergeRounds: 0,
    checkRounds: 0,
  });
  const afterMerge = {
    ...stateAfter(merge.round, [], merge.mergeRounds),
    head: mergedHead,
  };
  const correction = planReview(
    afterMerge,
    { since: mergedHead, commitScope: "author" },
    [docs],
  );
  expect(correction).toMatchObject({
    kind: "review",
    round: 5,
    mergeRounds: 0,
    checkRounds: 0,
  });
  const afterCorrection = {
    ...stateAfter(correction.round, [], correction.mergeRounds),
    head: correctedHead,
  };
  expect(
    planReview(
      afterCorrection,
      { since: correctedHead, commitScope: "author" },
      [docs],
    ),
  ).toMatchObject({ kind: "capped", capReason: "unreviewed-change" });
});
