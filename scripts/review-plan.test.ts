import { expect, test } from "vitest";
import { parseReviewerReport } from "./review-findings.ts";
import type { Finding } from "./review-findings.ts";
import type { ChangedFile } from "./review-lenses.ts";
import {
  buildRoundReport,
  checkRoundLimit,
  describeReviewScope,
  parseReviewPlan,
  planReview,
  reviewRoundLimit,
} from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import { parseLatestReviewState } from "./review-state.ts";
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

function stateAfter(round: number, openFindings: Finding[]): ReviewState {
  return { head, round, openFindings };
}

test("reviews the whole change in the first round", () => {
  expect(planReview(stateBeforeFirstRound, undefined, [docs])).toEqual({
    kind: "review",
    round: 1,
    since: undefined,
    lenses: ["consistency", "docs", "standards"],
    files: ["docs/product.md"],
    previous: stateBeforeFirstRound,
  });
});

test("reviews the files since the last reviewed head in a later round, up to the last review round", () => {
  const previous = stateAfter(reviewRoundLimit - 1, [openFinding]);
  expect(planReview(previous, head, [docs])).toMatchObject({
    kind: "review",
    round: reviewRoundLimit,
    since: head,
  });
});

test("passes without an agent when no file changed and no finding is open", () => {
  const previous = stateAfter(1, []);
  expect(planReview(previous, head, [])).toEqual({
    kind: "pass",
    round: 1,
    since: head,
    lenses: [],
    files: [],
    previous,
  });
});

test("keeps the open findings without an agent when no file changed, because nothing could have fixed them", () => {
  const previous = stateAfter(1, [openFinding]);
  expect(planReview(previous, head, [])).toMatchObject({
    kind: "unchanged",
    round: 1,
  });
});

test("checks only the open findings after the review rounds, up to the last check round", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  expect(
    planReview(stateAfter(reviewRoundLimit, [openFinding]), head, [docs]),
  ).toMatchObject({ kind: "check", round: reviewRoundLimit + 1, lenses: [] });
  expect(
    planReview(stateAfter(lastCheck - 1, [openFinding]), head, [docs]),
  ).toMatchObject({ kind: "check", round: lastCheck });
});

test("caps the rounds without an agent when findings stay open after the last check round", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  expect(
    planReview(stateAfter(lastCheck, [openFinding]), head, [docs]),
  ).toMatchObject({ kind: "capped", round: lastCheck });
});

test("caps the rounds without an agent when files change after the review rounds while no finding is open", () => {
  expect(
    planReview(stateAfter(reviewRoundLimit, []), head, [docs]),
  ).toMatchObject({ kind: "capped", round: reviewRoundLimit });
});

test("caps the rounds when every review round failed, so a change that no round finished reviewing never passes", () => {
  const failedRounds: ReviewState = {
    head: undefined,
    round: reviewRoundLimit,
    openFindings: [],
  };
  expect(planReview(failedRounds, undefined, [docs])).toMatchObject({
    kind: "capped",
    round: reviewRoundLimit,
  });
});

test("reads back the plan that the plan step writes, with and without a reviewed head", () => {
  const plans: ReviewPlan[] = [
    planReview(stateBeforeFirstRound, undefined, [docs]),
    planReview(stateAfter(1, [openFinding]), head, []),
  ];
  for (const plan of plans) {
    expect(parseReviewPlan(JSON.parse(JSON.stringify(plan)), "PLAN")).toEqual({
      ok: true,
      value: plan,
    });
  }
});

test("rejects a plan that names a lens outside the panel or files that are not a list of paths", () => {
  const plan = planReview(stateBeforeFirstRound, undefined, [docs]);
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

test("tells the reviewer whether the files hold the whole change or what changed since a head, and how to read the diff of one", () => {
  expect(describeReviewScope(undefined, "origin/main")).toBe(
    "They hold the whole change, and `git diff origin/main...HEAD -- <path>` shows what changed in one of them.",
  );
  expect(describeReviewScope(head, "origin/main")).toBe(
    `They hold what changed since ${head}, the head that the panel last reviewed, because earlier rounds reviewed the rest of the change. \`git diff ${head} HEAD -- <path>\` shows what changed in one of them since then, and \`git diff origin/main...HEAD -- <path>\` shows its whole change.`,
  );
});

test("builds the report of a review round with its findings numbered after the round before the open ones, and of a round that checks with the open findings alone", () => {
  const previous = stateAfter(1, [openFinding]);
  const review = planReview(previous, head, [docs]);
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
  const check = planReview(stateAfter(reviewRoundLimit, [openFinding]), head, [
    docs,
  ]);
  expect(buildRoundReport(check, undefined)).toEqual({
    findings: [openFinding],
    candidateStandards: [],
    readFiles: [],
    lensChecks: [],
  });
});
